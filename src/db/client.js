/*
Author: Jake Mathai
Purpose: ORM for RDBMS
*/

const Sequelize = require('sequelize')

const time = require('../utils/time')

const sequelize = new Sequelize(
    process.env.DB_SCHEMA || 'postgres',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
        'host': process.env.DB_HOST || 'db',
        'port': process.env.DB_PORT || 5432,
        'dialect': 'postgres',
        'dialectOptions': {
            'ssl': process.env.DB_SSL == 'true'
        }
    }
)

// Time series of a pair contract's liquidity events. Tracks the running reserve levels & implied volume.
// Volume is computed as the absolute difference in reserves from the last liquidity event
const PairLiquidity = sequelize.define(
    'PairLiquidity',
    {
        'address': {
            'type': Sequelize.STRING,
            'allowNull': false,
            'primaryKey': true
        },
        'datestamp': {
            'type': Sequelize.DATE,
            'allowNull': false,
            'primaryKey': true
        },
        'token0': {
            'type': Sequelize.STRING,
            'allowNull': false
        },
        'token1': {
            'type': Sequelize.STRING,
            'allowNull': false
        },
        'reserve0': {
            'type': Sequelize.DECIMAL,
            'allowNull': false
        },
        'reserve1': {
            'type': Sequelize.DECIMAL,
            'allowNull': false
        },
        'token0Volume': {
            'type': Sequelize.DECIMAL,
            'allowNull': true
        },
        'token1Volume': {
            'type': Sequelize.DECIMAL,
            'allowNull': true
        },
        'blockTimestamp': {
            'type': Sequelize.INTEGER,
            'allowNull': false
        }
    }
)

const createPairLiquidity = async liquidityPayload => {
    const lastPairLiquidity = await PairLiquidity.findOne({
        'where': { 
            'address': liquidityPayload['address'] 
        },
        'order': [['datestamp', 'DESC']],
    });
    if (lastPairLiquidity == null) {
        liquidityPayload['token0Volume'] = null
        liquidityPayload['token1Volume'] = null
    }
    else {
        liquidityPayload['token0Volume'] = Math.abs(liquidityPayload['reserve0'] - parseFloat(lastPairLiquidity['reserve0']))
        liquidityPayload['token1Volume'] = Math.abs(liquidityPayload['reserve1'] - parseFloat(lastPairLiquidity['reserve1']))
    }
    await PairLiquidity.create(liquidityPayload)
    return null
}

module.exports = {
    sequelize,
    PairLiquidity,
    createPairLiquidity,
}