/*
Author: Jake Mathai
Purpose: Uniswap client
*/

const { TheGraphClient } = require('../utils/thegraph')

const UniswapClient = () => {
    const thegraph = TheGraphClient()

    // Query subgraph for all pair contract addresses for the target token
    const getAllTokenPairs = async targetTokenAddress => {
        let queries = []
        for (let skip = 0; skip < 6000; skip += 1000)
            queries.push(thegraph.querySubgraph(
                'UniswapV2', 
                'Pair', 
                `first: 1000, skip: ${skip}, where: {token0: "${targetTokenAddress}"}`
            )) 
        for (let skip = 0; skip < 6000; skip += 1000)
            queries.push(thegraph.querySubgraph(
                'UniswapV2', 
                'Pair', 
                `first: 1000, skip: ${skip}, where: {token1: "${targetTokenAddress}"}`
            )) 
        const results = await Promise.all(queries)
        return [].concat.apply([], results);
    }

    const getETHPrice = async() => parseFloat((
        await thegraph.querySubgraph(
            'UniswapV2', 
            'Bundle', 
            'where: {id: "1"}'
        ))[0]['ethPrice']
    )

    const subscribeToToken = (tokenAddress, interval=1000) => (
        thegraph.watchQuery(
            'UniswapV2', 
            'Token', 
            `first: 1, where: {id: "${tokenAddress}"}`, 
            interval
        )
    )

    return {
        getAllTokenPairs,
        getETHPrice,
        getObservationsInWindow,
        getTokenVolume,
        getTokenLiquidity,
        getTokenLiquidityAndVolume,
        subscribeToToken
    }
}

module.exports = {
    UniswapClient
}
