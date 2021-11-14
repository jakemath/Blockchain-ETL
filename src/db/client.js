/*
Author: Jake Mathai
Purpose: ORM for RDBMS
*/

const Sequelize = require('sequelize')

const sequelize = new Sequelize(
    process.env.DB_SCHEMA || 'postgres',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
        'host': process.env.DB_HOST || 'db',
        'port': process.env.DB_PORT || 5432,
        'dialect': 'postgres',
        'logging': false,
        'dialectOptions': {
            'ssl': process.env.DB_SSL == 'true'
        }
    }
)

// Time series of a pair contract liquidity events
// - Tracks the running reserve levels for the pair contract
// - Volume for each token calculated as the absolute change in reserve levels from the previous liquidity event
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

module.exports = {
    sequelize,
    PairLiquidity,
}