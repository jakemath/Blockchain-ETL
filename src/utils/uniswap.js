/*
Author: Jake Mathai
Purpose: Uniswap client
*/

const { Op } = require('sequelize')

const db = require('../db/client')
const time = require('../utils/time')
const { TheGraphClient } = require('../utils/thegraph')

const UniswapClient = async() => {
    const thegraph = TheGraphClient()
    
    const getAllTokenSymbolsAndDecimals = async() => {
        let tokenSymbols = {}  // Map address to symbol
        let tokenDecimals = {} // Map address to decimals
        let queries = []
        for (let skip = 0; skip < 6000; skip += 1000)  // Paginated token query. Graph API limits skip to 6000 unfortunately
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

    console.log('Fetching Uniswap token info...')
    const [tokenSymbols, tokenDecimals] = await getAllTokenSymbolsAndDecimals()

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

    const getETHPrice = async() => (await thegraph.querySubgraph('UniswapV2', 'Bundle', 'where: {id: "1"}'))[0]['ethPrice']

    // Fetch token observations in window and take difference in totalVolumeUSD between the latest record and the earliest record
    const getTokenVolume = async(tokenAddress, fromDate=null, toDate=time.now()) => {
        if (typeof toDate == 'string')  // Coerce fromDate and toDate to datetime objects. If fromDate is null, assume 24h window before toDate
            toDate = new Date(toDate)
        if (typeof fromDate == 'string')
            fromDate = new Date(fromDate)
        const toDateUnix = time.datetimeToUnix(toDate)
        if (fromDate == null)
            fromDate = time.unixToDatetime(toDateUnix - (60*60*24))
        const observations = await db.TokenObservation.findAll({  // Find observations in window
            'where': {
                'address': tokenAddress,
                'datestamp': {
                    [Op.between] : [fromDate.toJSON(), toDate.toJSON()]
                }
            }
        })
        if (observations != null && observations.length >= 2)
            return parseFloat(observations[observations.length - 1].totalVolumeUSD) - parseFloat(observations[0].totalVolumeUSD)
        return 0
    }

    return {
        tokenSymbols,
        tokenDecimals,
        getAllTokenPairAddresses,
        getETHPrice,
        getTokenVolume
    }
}

module.exports = {
    UniswapClient
}

/*
const { UniswapClient } = require('./utils/uniswap')
const BADGER = '0x3472a5a71965499acd81997a54bba8d852c6e53d'
const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
fetchVolume = async() => {
    uniswap = await UniswapClient()
    console.log('WETH:', '$' + (await uniswap.getTokenVolumeGraph(WETH)).toLocaleString())
    console.log('BADGER:', '$' + (await uniswap.getTokenVolumeGraph(BADGER)).toLocaleString())
    console.log('USDC:', '$' + (await uniswap.getTokenVolumeGraph(USDC)).toLocaleString())
}
*/
