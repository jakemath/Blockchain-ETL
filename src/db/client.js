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

// Time series of a pair contract's liquidity events. Tracks the running reserve levels for the pair contract
const Liquidity = sequelize.define(
    'Liquidity',
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
        }
    }
)

// Time series of a pair contract's swap events. Used to calculate 24-hour volume
const Swap = sequelize.define(
    'Swap',
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
            'allowNull': false,
        },
        'token1': {
            'type': Sequelize.STRING,
            'allowNull': false,
        },
        'amount0In': {
            'type': Sequelize.DECIMAL,
            'allowNull': false,
        },
        'amount0Out': {
            'type': Sequelize.DECIMAL,
            'allowNull': false,
        },
        'amount1In': {
            'type': Sequelize.DECIMAL,
            'allowNull': false,
        },
        'amount1Out': {
            'type': Sequelize.DECIMAL,
            'allowNull': false,
        }
    }
)

module.exports = {
    sequelize,
    Liquidity,
    Swap
}