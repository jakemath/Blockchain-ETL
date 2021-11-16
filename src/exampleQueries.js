/*
Author: Jake Mathai
Purpose: Query 24-hour uniswap stats
*/

const { UniswapClient } = require('./utils/uniswap')

BADGER = '0x3472a5a71965499acd81997a54bba8d852c6e53d'

let fetchStats = async() => {
    const uniswap = UniswapClient()
    let stats = await uniswap.getTokenLiquidityAndVolume(BADGER)
    console.log(`BADGER 24-hour stats from now`)
    console.log(`---> Liquidity: $${stats[0].toLocaleString()}`)
    console.log(`---> Volume: $${stats[1].toLocaleString()}`)
    stats = await uniswap.getTokenLiquidityAndVolume(BADGER, '2021-11-15')
    console.log(`BADGER 24-hour stats from yesterday`)
    console.log(`---> Liquidity: $${stats[0].toLocaleString()}`)
    console.log(`---> Volume: $${stats[1].toLocaleString()}`)
}

module.exports = {
    fetchStats
}