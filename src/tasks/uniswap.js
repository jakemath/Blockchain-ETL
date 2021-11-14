/*
Author: Jake Mathai
Purpose: Real-time Uniswap data streaming - fetches pair contract addresses for target tokens, and listens for event emissions from the contracts
- When an event is observed, reads the balances stored on the pair contracts and writes the updated values to the DB
- Pair reserve volume is derived from the absolute change in reserve levels between events
- 24-hour trading volume for a token is calculated by summing the volume observations across all the token's pairs in the past 24 hours
*/

const { Op } = require('sequelize')
const IUniswapV2PairABI = require('@uniswap/v2-core/build/IUniswapV2Pair')

const db = require('../db/client')
const time = require('../utils/time')
const thegraph = require('../utils/thegraph')

const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

const tokens = {
    '0x3472a5a71965499acd81997a54bba8d852c6e53d': 'BADGER',
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH',
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
    '0x514910771af9ca656af840dff83e8264ecf986ca': 'LINK'
}

// Query subgraph for all pair contract addresses for the target token
const fetchAllTokenPairAddresses = async targetTokenAddress => {
    const results = await Promise.all([
        thegraph.querySubgraph('UniswapV2', 'Pair', `first: 1000, where: {token0: "${targetTokenAddress}"}`), 
        thegraph.querySubgraph('UniswapV2', 'Pair', `first: 1000, where: {token1: "${targetTokenAddress}"}`)
    ])
    return results[0].concat(results[1])
}

const fetchUSDCPairAddress = async targetTokenAddress => {
    const token0Results = thegraph.querySubgraph('UniswapV2', 'Pair', `first: 1, where: {token0: ${targetTokenAddress}, token1: ${USDC_ADDRESS}`)
    if (token0Results.length != 0)
        return token0Results[0]['id']
    const token1Results = thegraph.querySubgraph('UniswapV2', 'Pair', `first: 1, where: {token0: ${USDC_ADDRESS}, token1: ${targetTokenAddress}`)
    if (token1Results.length != 0)
        return token1Results[0]['id']
    return null
}

const getUSDCPrice = async usdcPairContract => {
    const reserves = await usdcPairContract.getReserves()
    let usdcReserves, tokenReserves
    if (await usdcPairContract.token0() == USDC_ADDRESS) {
        usdcReserves = reserves[0]
        tokenReserves = reserves[1]
    }
    else {
        usdcReserves = reserves[1]
        tokenReserves = reserves[0]
    }
    return (usdcReserves*1e12)/tokenReserves  // USDC has only 6 decimal places
}

// Fetches liquidity events across all pairs including the target token in the past 24 hours, then aggregates the individual 
// volume measures as the total traded amount
const getToken24HVolume = async(tokenAddress='0x3472a5a71965499acd81997a54bba8d852c6e53d') => {
    let currentTime = time.unixTime()
    let oneDayAgo = currentTime - (60*60*24)
    currentTime = time.unixToDatetime(currentTime).toJSON()
    oneDayAgo = time.unixToDatetime(oneDayAgo).toJSON()
    console.log(`Calculating ${tokens[tokenAddress]} volume from ${oneDayAgo} to ${currentTime}`)
    const tokenPairLiquidities = await db.PairLiquidity.findAll({
        'where': {
            [Op.or]: [
                {'token0': tokenAddress}, 
                {'token1': tokenAddress}
            ],
            'datestamp': {
                [Op.between] : [oneDayAgo, currentTime]
            },
        }
    })
    let volumes = tokenPairLiquidities.map(
        item => item.get('token0') == tokenAddress ? item.get('token0Volume') : item.get('token1Volume')
    )
    volumes = volumes.filter(x => x != null).map(parseFloat)
    return volumes.reduce((a, b) => a + b, 0.0)
}

// Calculates token volumes as the change in reserve levels from the pair's previous liquidity event before writing to DB
const createPairLiquidity = async liquidityPayload => {
    const lastPairLiquidity = await db.PairLiquidity.findOne({
        'where': { 
            'address': liquidityPayload['address'] 
        },
        'order': [['datestamp', 'DESC']],
    });
    if (lastPairLiquidity == null) {
        liquidityPayload['token0Volume'] = null
        liquidityPayload['token1Volume'] = null
    }
    else {
        liquidityPayload['token0Volume'] = Math.abs(liquidityPayload['reserve0'] - parseFloat(lastPairLiquidity['reserve0']))
        liquidityPayload['token1Volume'] = Math.abs(liquidityPayload['reserve1'] - parseFloat(lastPairLiquidity['reserve1']))
    }
    await db.PairLiquidity.create(liquidityPayload)
    return null
}

task('uniswap', 'Track uniswap tokens')
    .setAction(async() => {
        // Use WebSocket provider to efficiently listen for events without exceeding provider query provisions
        let provider = new ethers.providers.WebSocketProvider(process.env.WS_URL, 'mainnet')
        let contracts = {}
        // Sync events emit whenever the Mint, Burn, or Swap functions are called, indicating a change in liquidity/volume
        const syncEventTopic = ethers.utils.id('Sync(uint112,uint112)')
        const tokenAddresses = Object.keys(tokens)
        const useDB = process.env['PROD'] == 'true'

        const monitorTokenPairs = async tokenAddress => {
            const symbol = tokens[tokenAddress]
            console.log(`Fetching ${symbol} pairs...`)
            const pairs = await fetchAllTokenPairAddresses(tokenAddress)
            console.log(`${pairs.length} pairs for ${symbol} found`)
            for (const pair of pairs) {
                const pairAddress = pair['id']
                const token0Address = pair['token0']['id']
                const token1Address = pair['token1']['id']
                console.log(`---> Monitoring ${symbol} pair ${pairAddress}`)
                if (contracts[pairAddress] == null)
                    contracts[pairAddress] = new ethers.Contract(
                        pairAddress,
                        IUniswapV2PairABI.abi,
                        provider
                    )
                provider.once('block', async() => {  // Listen for new block
                    provider.on({  // Listen for sync events in new block
                        'address': pairAddress,
                        'topics': [syncEventTopic]
                    }, async event => {  // Once Sync observed -> read reserves from contract and write to db
                        try {
                            const pairContract = contracts[pairAddress]
                            const reserves = await pairContract.getReserves()
                            const liquidityPayload = {
                                'address': pairAddress,
                                'token0': token0Address,
                                'token1': token1Address,
                                'reserve0': reserves[0]/1e18,
                                'reserve1': reserves[1]/1e18,
                                'datestamp': time.now().toJSON(),
                                'blockTimestamp': reserves[2]
                            }
                            console.log(`${symbol} SYNC:`, liquidityPayload)
                            if (useDB) {
                                await createPairLiquidity(liquidityPayload)
                                const label = `VolumeCalc:${symbol}:${time.now().toJSON()}`
                                console.time(label)
                                const token24HVolume = await getToken24HVolume(tokenAddress)
                                console.timeEnd(label)
                                console.log(`${symbol} 24-hour volume across all pairs: ${token24HVolume}`)
                            }
                        }
                        catch(e) {
                            console.log(e)
                        }
                    })
                })
            }
        }

        for (const tokenAddress of tokenAddresses) 
            monitorTokenPairs(tokenAddress)
        while (true)
            await time.sleep(3600)  // Keep listening processes alive
    })
