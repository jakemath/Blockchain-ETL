/*
Author: Jake Mathai
Purpose: DB testing
*/

const db = require('./client')

beforeAll(async() => {
    await db.sequelize.sync({'force': true})
})

test('Create Pair', async() => {
    expect.assertions(1)
    const pair = await db.Pair.create({
        'address': '0',
        'token0': '0x',
        'token1': '0xx',
        'reserve0': 0,
        'reserve1': 0
    })
    expect(token.id).toEqual(1)
})

test('Get Pair', async() => {
    expect.assertions(3);
    const pair = await db.Pair.findByPk('0')
    expect(pair.address).toEqual('0x')
    expect(pair.token0).toEqual('0x')
    expect(pair.token1).toEqual('0xx')
})

test('Delete Pair', async() => {
    expect.assertions(1)
    await db.Pair.destroy({
        'where': {
            'address': '0'
        }
    })
    const pair = await db.Pair.findByPk('0')
    expect(pair).toBeNull()
})
