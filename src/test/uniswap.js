/*
Author: Jake Mathai
Purpose: Uniswap tests
*/

const db = require('../db/client')
const { UniswapClient } = require('../utils/uniswap')

let uniswap = UniswapClient()
let startDate = new Date()

beforeAll(async() => {
    await db.TokenObservation.destroy({
        'where': {
            'address': '1'
        }
    })
    const startingVolume = 1
    for (let i = 0; i < 10; ++i) {
        let date = startDate
        date.setUTCMinutes(startDate.getUTCMinutes() + i)
        await db.TokenObservation.create({
            'address': '1',
            'datestamp': date,
            'totalTokenVolume': startingVolume + i,
            'totalTokenLiquidity': 10,
            'price': 100
        })
    }
})

test('getETHPrice', async() => {
    expect.assertions(1)
    const ethPrice = await uniswap.getETHPrice()
    expect(Number.isNaN(ethPrice)).toBe(false)
})

test('Get TokenObservations in window', async() => {
    expect.assertions(1)
    const observations = await uniswap.getObservationsInWindow('1', startDate)
    expect(observations.length).toEqual(10)
})

test('getTokenLiquidityAndVolume', async() => {
    expect.assertions(2)
    const [liquidity, volume] = await uniswap.getTokenLiquidityAndVolume('1', startDate)
    expect(liquidity).toEqual(1000)
    expect(volume).toEqual(500)
})

afterAll(async() => {
    await db.TokenObservation.destroy({
        'where': {
            'address': '1'
        }
    })
})