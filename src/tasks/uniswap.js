/*
Author: Jake Mathai
Purpose: Uniswap data streaming tasks
*/

const IUniswapV2PairABI = require('@uniswap/v2-core/build/IUniswapV2Pair')

const time = require('../utils/time')
const thegraph = require('../utils/thegraph')

const db = require('../db/client')

const tokens = {
    // "BADGER": "0x3472a5a71965499acd81997a54bba8d852c6e53d",
    "WETH": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    // "USDC": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    // "LINK": "0x514910771af9ca656af840dff83e8264ecf986ca"
}

const fetchAllTokenPairAddresses = async targetTokenAddress => {  // Query subgraph for all pair contracts for the target token
    const results = await Promise.all([
        thegraph.querySubgraph('UniswapV2', 'Pair', `first: 1000, where: {token0: "${targetTokenAddress}"}`), 
        thegraph.querySubgraph('UniswapV2', 'Pair', `first: 1000, where: {token1: "${targetTokenAddress}"}`)
    ])
    return results[0].concat(results[1])
}

task('uniswap', 'Track uniswap tokens')
    .setAction(async() => {
        // Use WebSocket provider to efficiently listen for events without maxing out provider query provisions
        let provider = new ethers.providers.WebSocketProvider(process.env.WS_URL, 'mainnet')
        let contracts = {}
        // Sync events emit from a pair contract whenever the Mint, Burn, or Swap functions are called, indicating a change in liquidity & volume
        const syncEventTopic = ethers.utils.id('Sync(uint112,uint112)')
        const tokenAddresses = Object.values(tokens)
        const useDB = process.env['PROD'] == 'true'
        for (const tokenAddress of tokenAddresses) {
            console.log(`Fetching ${tokenAddress} pairs...`)
            const pairs = await fetchAllTokenPairAddresses(tokenAddress)
            for (const pair of pairs) {
                const pairAddress = pair['id']
                const token0Address = pair['token0']['id']
                const token1Address = pair['token1']['id']
                console.log(`---> Monitoring pair: ${pairAddress}`)
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
                            if (useDB)
                                await db.createPairLiquidity(liquidityPayload)
                            else
                                console.log(liquidityPayload)
                        }
                        catch(e) {
                            console.log(e)
                        }
                    })
                })
            }
            setInterval(db.getToken24HVolume, 30000, tokenAddress)
        }
        while (true)
            await time.sleep(3600)  // Keep listening processes alive
    })
