/*
Author: Jake Mathai
Purpose: Uniswap tests
*/

const db = require('../db/client')
const { UniswapClient } = require('../utils/uniswap')

let uniswap = UniswapClient()

const TEST_ADDRESS = '2'

beforeAll(async() => {
    await db.sequelize.sync({'force': true})
    await db.TokenObservation.destroy({
        'where': {
            'address': TEST_ADDRESS
        }
    })
    let startDate = new Date()
    const startingVolume = 1
    for (let i = 0; i < 10; ++i) {
        let date = startDate
        date.setUTCMinutes(startDate.getUTCMinutes() + i)
        await db.TokenObservation.create({
            'address': TEST_ADDRESS,
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
    const observations = await uniswap.getObservationsInWindow(TEST_ADDRESS)
    expect(observations.length).toEqual(10)
})

test('getTokenLiquidityAndVolume', async() => {
    expect.assertions(2)
    const [liquidity, volume] = await uniswap.getTokenLiquidityAndVolume(TEST_ADDRESS)
    expect(liquidity).toEqual(1000)
    expect(volume).toEqual(500)
})

afterAll(async() => {
    await db.TokenObservation.destroy({
        'where': {
            'address': TEST_ADDRESS
        }
    })
})