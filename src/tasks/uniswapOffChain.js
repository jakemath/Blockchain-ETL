/*
Author: Jake Mathai
Purpose: Uniswap off-chain tasks. Example task: track updates to Token entities in subgraph
*/

const db = require('../db/client')
const time = require('../utils/time')
const { UniswapClient } = require('../utils/uniswap')
const { TheGraphClient } = require('../utils/thegraph')

const trackTokens = async() => {
    const uniswap = UniswapClient()
    const thegraph = TheGraphClient()

    const targetTokens = {  // Tokens to track
        '0x3472a5a71965499acd81997a54bba8d852c6e53d': 'BADGER',
        // '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH',
        // '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
        // '0x514910771af9ca656af840dff83e8264ecf986ca': 'LINK'
    }
    const targetTokenAddresses = Object.keys(targetTokens)
    const useDB = process.env['PROD'] == 'true'

    const monitorToken = async targetTokenAddress => {
        const targetTokenSymbol = targetTokens[targetTokenAddress]
        console.log(`Monitoring ${targetTokenSymbol}...`)
        // Query the Token entity and poll for record updates every second
        let tokenObservationMonitor = thegraph.watchQuery('UniswapV2', 'Token', `first: 1, where: {id: "${targetTokenAddress}"}`, 1000)
        tokenObservationMonitor.subscribe({
            'next': async({data}) => {  // On new entity -> calculate price and write to DB
                try {
                    const updatedRecord = data['tokens'][0]
                    let tokenPayload = {
                        'address': targetTokenAddress,
                        'datestamp': time.now().toJSON(),
                        'totalTokenVolume': parseFloat(updatedRecord['tradeVolume']),
                        'totalTokenLiquidity': parseFloat(updatedRecord['totalLiquidity'])
                    }
                    const ethPrice = await uniswap.getETHPrice()
                    tokenPayload['price'] = parseFloat(updatedRecord['derivedETH']) * ethPrice
                    console.log(`${targetTokenSymbol} TOKEN OBSERVATION:`, tokenPayload)
                    if (useDB) {
                        await db.TokenObservation.create(tokenPayload)
                        const label = `${targetTokenSymbol}:${time.now().toJSON()}`
                        console.time(label)
                        const [liquidity, volume] = await uniswap.getTokenLiquidityAndVolume(targetTokenAddress)
                        console.timeEnd(label)
                        console.log(`${targetTokenSymbol} 24-hour stats`)
                        console.log(`---> Liquidity: $${liquidity.toLocaleString()}`)
                        console.log(`---> Volume: $${volume.toLocaleString()}`)
                    }
                    return null
                }
                catch(e) {
                    console.log(e)
                }
            },
            'error': err => {
                console.log('ERROR:', err)
                process.exit(1)  // On error -> kill process and force container restart
            }
        })
    }

    for (const targetTokenAddress of targetTokenAddresses)
        monitorToken(targetTokenAddress)
    while (true)
        await time.sleep(3600)  // Keep monitoring processes alive
}

module.exports = {
    trackTokens
}