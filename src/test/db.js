/*
Author: Jake Mathai
Purpose: DB testing
*/

const db = require('../db/client')

beforeAll(async() => {
    await db.sequelize.sync({'force': true})
    await db.TokenObservation.destroy({
        'where': {
            'address': '0'
        }
    })
})

// Create 10 minute-by-minute observations with steady volume increase and constant liquidity
test('Create TokenObservations', async() => {
    expect.assertions(1)
    const startDate = new Date()
    const startingVolume = 1
    let totalRecords = 0
    for (let i = 0; i < 10; ++i) {
        let date = startDate
        date.setUTCMinutes(startDate.getUTCMinutes() + i)
        const createdObservation = await db.TokenObservation.create({
            'address': '0',
            'datestamp': date,
            'totalTokenVolume': startingVolume + i,
            'totalTokenLiquidity': 10,
            'price': 100
        })
        if (createdObservation != null)
            ++totalRecords
    }
    expect(totalRecords).toEqual(10)
})

// Query created observations, assert all present
test('Get TokenObservations', async() => {
    expect.assertions(1 + 3*10);
    const observations = await db.TokenObservation.findAll({
        'where': {
            'address': '0'
        },
        'raw': true
    })
    expect(observations.length).toEqual(10)
    for (const observation of observations) {
        expect(observation.address).toEqual('0')
        expect(observation.totalTokenLiquidity).toEqual(10)
        expect(observation.price).toEqual(100)
    }
})

test('Delete TokenObservations', async() => {
    expect.assertions(1)
    await db.TokenObservation.destroy({
        'where': {
            'address': '0'
        },
    })
    const observations = await db.TokenObservation.findAll({
        'where': {
            'address': '0'
        },
        'raw': true
    })
    expect(observations.length).toEqual(0)
})
