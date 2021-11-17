/*
Author: Jake Mathai
Purpose: Uniswap off-chain tasks. Example task: track updates to Token entities in subgraph
*/

const db = require('../db/client')
const time = require('../utils/time')
const { UniswapClient } = require('../utils/uniswap')

const trackTokens = async() => {
    const uniswap = UniswapClient()

    const targetTokens = {  // Tokens to track
        '0x3472a5a71965499acd81997a54bba8d852c6e53d': 'BADGER',
        // '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH',
        // '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
        // '0x514910771af9ca656af840dff83e8264ecf986ca': 'LINK'
    }
    const targetTokenAddresses = Object.keys(targetTokens)
    const useDB = process.env['PROD'] == 'true'

    let highestObservedVolumes = {}

    const trackToken = async targetTokenAddress => {
        const targetTokenSymbol = targetTokens[targetTokenAddress]
        console.log(`Monitoring ${targetTokenSymbol}...`)
        // Query the Token entity and poll for record updates every second
        let tokenObservationMonitor = uniswap.subscribeToToken(targetTokenAddress)
        tokenObservationMonitor.subscribe({
            'next': async({data}) => {  // On new entity -> calculate price and write to DB
                try {
                    console.log(`${targetTokenSymbol} OBSERVATION`)
                    const updatedRecord = data['tokens'][0]
                    const observationVolume = parseFloat(updatedRecord['tradeVolume'])
                    let tokenPayload = {
                        'address': targetTokenAddress,
                        'datestamp': time.now().toJSON(),
                        'totalTokenVolume': observationVolume,
                        'totalTokenLiquidity': parseFloat(updatedRecord['totalLiquidity'])
                    }
                    // Data correctness: All-time volume should be strictly constant or increasing. Keep track of the last total volume number
                    // recorded, and only update if a higher number observed
                    let highestObservedVolume = highestObservedVolumes[targetTokenAddress]
                    if (highestObservedVolume == null) {
                        const lastObservation = await db.TokenObservation.findOne({
                            'where': {'address': targetTokenAddress},
                            'order': [['datestamp', 'DESC']],
                            'raw': true
                        })
                        if (lastObservation == null)
                            highestObservedVolume = 0
                        else
                            highestObservedVolume = parseFloat(lastObservation.totalTokenVolume)
                        highestObservedVolumes[targetTokenAddress] = highestObservedVolume
                    }
                    if (observationVolume > highestObservedVolume) {
                        highestObservedVolumes[targetTokenAddress] = observationVolume
                        console.log(`---> New highest volume: ${observationVolume}`)
                    }
                    else
                        tokenPayload['totalTokenVolume'] = highestObservedVolume
                    const ethPrice = await uniswap.getETHPrice()
                    tokenPayload['price'] = parseFloat(updatedRecord['derivedETH']) * ethPrice
                    if (useDB) {
                        await db.TokenObservation.create(tokenPayload)
                        const [liquidity, volume] = await uniswap.getTokenLiquidityAndVolume(targetTokenAddress)
                        console.log(`---> 24-hour liquidity: $${liquidity.toLocaleString()}`)
                        console.log(`---> 24-hour volume: $${volume.toLocaleString()}`)
                    }
                    return null
                }
                catch(e) {
                    console.log(e)
                }
            },
            'error': e => {  // Network errors may randomly disrupt the connection to the server 
                console.log('APOLLO_ERROR:', e)
                process.exit(1)  // Kill the process to force container restart
            }
        })
    }

    for (const targetTokenAddress of targetTokenAddresses)
        await trackToken(targetTokenAddress)
    while (true)
        await time.sleep(3600)  // Keep monitoring processes alive
}

module.exports = {
    trackTokens
}