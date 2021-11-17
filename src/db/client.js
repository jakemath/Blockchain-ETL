/*
Author: Jake Mathai
Purpose: Sequelize ORM for RDBMS
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
            'ssl': process.env.DB_SSL == 'true',
        }
    }
)

// Time series of observed token entities published on Uniswap subgraph
const TokenObservation = sequelize.define(
    'TokenObservation',
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
        'totalTokenVolume': {
            'type': Sequelize.DECIMAL,
            'allowNull': false
        },
        'totalTokenLiquidity': {
            'type': Sequelize.DECIMAL,
            'allowNull': false
        },
        'price': {
            'type': Sequelize.DECIMAL,
            'allowNull': false
        },
    }
)

module.exports = {
    sequelize,
    TokenObservation,
}