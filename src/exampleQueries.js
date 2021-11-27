/*
Author: Jake Mathai
Purpose: Query 24-hour uniswap stats
*/

const { UniswapClient } = require('./utils/uniswap')

// Dates available: 2021-11-18, 2021-11-19, 2021-11-20
BADGER = '0x3472a5a71965499acd81997a54bba8d852c6e53d'

let fetchStats = async() => {
    const uniswap = UniswapClient()
    const windows = [
        ['2021-11-18', '2021-11-19'],
        ['2021-11-18', '2021-11-20'],
        ['2021-11-18', '2021-11-21'],
        ['2021-11-19', '2021-11-20'],
        ['2021-11-19', '2021-11-21'],
        ['2021-11-20', '2021-11-21']
    ]
    for (const window of windows) {
        const fromDate = new Date(window[0])
        const toDate = new Date(window[1])
        let stats = await uniswap.getTokenLiquidityAndVolume(BADGER, fromDate, toDate)
        console.log(`BADGER stats from ${fromDate.toLocaleString()} to ${toDate.toLocaleString()}`)
        console.log(`---> Liquidity: $${stats[0].toLocaleString()}`)
        console.log(`---> Volume: $${stats[1].toLocaleString()}\n`)
    }
}

module.exports = {
    fetchStats
}