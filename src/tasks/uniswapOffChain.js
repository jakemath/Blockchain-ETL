/*
Author: Jake Mathai
Purpose: Real-time Uniswap data streaming; fetches pair contract addresses for target tokens, and listens for event emissions from the contracts
- Sync events are recorded as Liquidity items in the DB
- Swap events are recorded as Swap items in the DB
*/

const db = require('../db/client')
const time = require('../utils/time')
const { UniswapClient } = require('../utils/uniswap')
const { TheGraphClient } = require('../utils/thegraph')

const trackTokens = async() => {
    const uniswap = await UniswapClient()
    const thegraph = TheGraphClient()

    const targetTokens = {  // Tokens to track
        '0x3472a5a71965499acd81997a54bba8d852c6e53d': 'BADGER',
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH',
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
        '0x514910771af9ca656af840dff83e8264ecf986ca': 'LINK'
    }
    const targetTokenAddresses = Object.keys(targetTokens)
    const useDB = process.env['PROD'] == 'true'

    const monitorToken = async targetTokenAddress => {
        const targetTokenSymbol = targetTokens[targetTokenAddress]
        console.log(`Monitoring ${targetTokenSymbol}...`)
        // Query the Token entity and poll for the updated record every second
        let tokenObservationMonitor = thegraph.watchQuery('UniswapV2', 'Token', `first: 1, where: {id: "${targetTokenAddress}"}`, 1000)
        tokenObservationMonitor.subscribe({
            'next': async({data}) => {  // New values in the entity -> aggregate volume, convert liquidity to USD and write to DB
                const updatedRecord = data['tokens'][0]
                const tokenPayload = {
                    'address': targetTokenAddress,
                    'datestamp': time.now().toJSON(),
                    'derivedETH': parseFloat(updatedRecord['derivedETH']),
                    'totalVolumeUSD': parseFloat(updatedRecord['tradeVolumeUSD']) + parseFloat(updatedRecord['untrackedVolumeUSD']),
                }
                const ethPrice = await uniswap.getETHPrice()
                tokenPayload['liquidityUSD'] = parseFloat(updatedRecord['totalLiquidity']) * tokenPayload['derivedETH'] * ethPrice // Convert to USD
                console.log(`${targetTokenSymbol} TOKEN OBSERVATION:`, tokenPayload)
                if (useDB) {
                    await db.TokenObservation.create(tokenPayload)
                    const label = `${targetTokenSymbol}:${time.now().toJSON()}`
                    console.time(label)
                    const volume = await uniswap.getTokenVolume(targetTokenAddress)
                    console.timeEnd(label)
                    console.log(`${targetTokenSymbol} 24-hour volume: $${volume.toLocaleString()}`)
                }
                return null
            }
        })
    }

    for (const targetTokenAddress of targetTokenAddresses)
        monitorToken(targetTokenAddress)
    while (true)
        await time.sleep(3600)
}

module.exports = {
    trackTokens
}