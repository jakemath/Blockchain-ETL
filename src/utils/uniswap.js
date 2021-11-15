/*
Author: Jake Mathai
Purpose: Uniswap data streaming utils
*/

const { Op } = require('sequelize')

const db = require('../db/client')
const time = require('../utils/time')
const thegraph = require('../utils/thegraph')

const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

const getAllTokenSymbolsAndDecimals = async() => {
    let tokenSymbols = {}  // Map address to symbol
    let tokenDecimals = {} // Map address to decimals
    let queries = []
    for (let skip = 0; skip <= 6000; skip += 1000)
        queries.push(thegraph.querySubgraph('UniswapV2', 'Token', `first: 1000, skip: ${skip}, orderBy: "tradeVolumeUSD", orderDirection: desc`)) 
    let results = await Promise.all(queries)
    results.forEach(resultSet => {
        resultSet.forEach(tokenResult => {
            const tokenAddress = tokenResult['id']
            tokenSymbols[tokenAddress] = tokenResult['symbol']
            tokenDecimals[tokenAddress] = tokenResult['decimals']
        })
    })
    return [tokenSymbols, tokenDecimals]
}

// Query subgraph for all pair contract addresses for the target token
const getAllTokenPairAddresses = async targetTokenAddress => {
    let queries = []
    for (let skip = 0; skip < 6000; skip += 1000)
        queries.push(thegraph.querySubgraph('UniswapV2', 'Pair', `first: 1000, skip: ${skip}, where: {token0: "${targetTokenAddress}"}`)) 
    for (let skip = 0; skip < 6000; skip += 1000)
        queries.push(thegraph.querySubgraph('UniswapV2', 'Pair', `first: 1000, skip: ${skip}, where: {token1: "${targetTokenAddress}"}`)) 
    const results = await Promise.all(queries)
    return [].concat.apply([], results);
}

const getUSDCPairAddress = async targetTokenAddress => {
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
const getToken24HVolume = async(tokenAddress='0x3472a5a71965499acd81997a54bba8d852c6e53d', tokenSymbol=null) => {
    let currentTime = time.unixTime()
    let oneDayAgo = currentTime - (60*60*24)
    currentTime = time.unixToDatetime(currentTime).toJSON()
    oneDayAgo = time.unixToDatetime(oneDayAgo).toJSON()
    console.log(`Calculating ${tokenSymbol || tokenAddress} volume from ${oneDayAgo} to ${currentTime}`)
    let totalVolume = 0
    let filter = {
        'datestamp': {
            [Op.between] : [oneDayAgo, currentTime]
        },
    }
    for (tokenNum in [0, 1]) {
        filter['where'] = {}
        filter['where'][`token${tokenNum}`] = tokenAddress
        const tokenNumPairLiquidities = await db.Swap.findAll(filter)
        if (tokenNumPairLiquidities.length == 0)
            continue
        const amountIn = `amount${tokenNum}In`
        const amountOut = `amount${tokenNum}Out`
        let volumes = tokenNumPairLiquidities.map(
            item => [item.get(amountIn), item.get(amountOut)]
        )
        volumes = volumes.map(x => parseFloat(x[0] != null ? x[0] : x[1] != null ? x[1] : 0.0))
        totalVolume += volumes.reduce((a, b) => a + b, 0.0)
    }
    return totalVolume
}


module.exports = {
    getAllTokenSymbolsAndDecimals,
    getAllTokenPairAddresses,
    getUSDCPairAddress,
    getUSDCPrice,
    getToken24HVolume
}
