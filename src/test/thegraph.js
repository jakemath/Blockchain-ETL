/*
Author: Jake Mathai
Purpose: The Graph client tests
*/

const { TheGraphClient } = require('../utils/thegraph')

let thegraph = TheGraphClient()

test('querySubgraph', async() => {
    expect.assertions(2)
    const ethToken = await thegraph.querySubgraph(
        'UniswapV2', 
        'Token', 
        `first: 1, where: {id: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"}`
    )
    expect(ethToken.length).toEqual(1)
    expect(ethToken[0]['id']).toEqual('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')
})