/*
Author: Jake Mathai
Purpose: Uniswap tests
*/

const db = require('../db/client')
const { UniswapClient } = require('../utils/uniswap')

let uniswap = UniswapClient()

const TEST_ADDRESS = '2'

beforeAll(async() => {
    await db.TokenObservation.destroy({
        'where': {'address': TEST_ADDRESS}
    })
})

test('Create TokenObservations', async() => {
    let date = new Date()
    date.setUTCDate(date.getUTCDate() - 1)
    const startingVolume = 1.0
    for (let i = 0; i < 10; ++i) {
        date.setUTCMinutes(date.getUTCMinutes() + 1)
        await db.TokenObservation.create({
            'address': TEST_ADDRESS,
            'datestamp': date.toJSON(),
            'totalTokenVolume': startingVolume + i,
            'totalTokenLiquidity': 10.0,
            'price': 100.0
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
    let fromDate = new Date()
    fromDate.setUTCDate(fromDate.getUTCDate() - 2)
    const observations = await uniswap.getObservationsInWindow(TEST_ADDRESS, fromDate)
    expect(observations.length).toEqual(10)
})

test('getTokenLiquidityAndVolume', async() => {
    expect.assertions(2)
    let fromDate = new Date()
    fromDate.setUTCDate(fromDate.getUTCDate() - 2)
    const [liquidity, volume] = await uniswap.getTokenLiquidityAndVolume(TEST_ADDRESS, fromDate)
    expect(liquidity).toBeCloseTo(1000.0, 1)
    expect(volume).toBeCloseTo(900.0, 1)
})

afterAll(async() => {
    await db.TokenObservation.destroy({
        'where': {'address': TEST_ADDRESS}
    })
})