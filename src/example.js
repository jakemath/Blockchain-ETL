/*
Author: Jake Mathai
Purpose: Query 24-hour uniswap stats
*/

const { UniswapClient } = require('./utils/uniswap')
BADGER = '0x3472a5a71965499acd81997a54bba8d852c6e53d'
WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
fetchStats = async() => {
    uniswap = await UniswapClient()
    let stats = await uniswap.getTokenLiquidityAndVolume(BADGER)
    console.log(`BADGER 24-hour stats`)
    console.log(`---> Liquidity: $${stats[0].toLocaleString()}`)
    console.log(`---> Volume: $${stats[1].toLocaleString()}`)
    stats = await uniswap.getTokenLiquidityAndVolume(WETH)
    console.log(`WETH 24-hour stats`)
    console.log(`---> Liquidity: $${stats[0].toLocaleString()}`)
    console.log(`---> Volume: $${stats[1].toLocaleString()}`)
    stats = await uniswap.getTokenLiquidityAndVolume(USDC)
    console.log(`USDC 24-hour stats`)
    console.log(`---> Liquidity: $${stats[0].toLocaleString()}`)
    console.log(`---> Volume: $${stats[1].toLocaleString()}`)
}
