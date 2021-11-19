/*
Author: Jake Mathai
Purpose: DB testing
*/

const db = require('../db/client')

const TEST_ADDRESS = '1'

beforeAll(async() => {
    await db.TokenObservation.destroy({
        'where': {'address': TEST_ADDRESS}
    })
})

// Create 10 minute-by-minute observations with steady volume increase and constant liquidity
test('Create TokenObservations', async() => {
    expect.assertions(1)
    let date = new Date()
    const startingVolume = 1.0
    let totalRecords = 0
    for (let i = 0; i < 10; ++i) {
        date.setUTCMinutes(date.getUTCMinutes() + 1)
        const createdObservation = await db.TokenObservation.create({
            'address': TEST_ADDRESS,
            'datestamp': date.toJSON(),
            'totalTokenVolume': startingVolume + i,
            'totalTokenLiquidity': 10.0,
            'price': 100.0
        })
        if (createdObservation != null)
            ++totalRecords
    }
    expect(totalRecords).toEqual(10)
})

// Query created observations, assert all present
test('Get TokenObservations', async() => {
    expect.assertions(31);
    const observations = await db.TokenObservation.findAll({
        'where': {'address': TEST_ADDRESS},
        'raw': true
    })
    expect(observations.length).toEqual(10)
    for (const observation of observations) {
        expect(observation.address).toEqual('1')
        expect(parseFloat(observation.totalTokenLiquidity)).toEqual(10.0)
        expect(parseFloat(observation.price)).toEqual(100.0)
    }
})

test('Delete TokenObservations', async() => {
    expect.assertions(1)
    await db.TokenObservation.destroy({
        'where': {'address': TEST_ADDRESS},
    })
    const observations = await db.TokenObservation.findAll({
        'where': {'address': TEST_ADDRESS},
        'raw': true
    })
    expect(observations.length).toEqual(0)
})
