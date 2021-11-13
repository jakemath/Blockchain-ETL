/*
Author: Jake Mathai
Purpose: ORM for RDBMS
*/

const Sequelize, { Op } = require('sequelize')

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

// Time series of a pair contract's reserve levels & volume computed as absolute difference in reserves from previous timestamp
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
        liquidityPayload['token0Volume'] = Math.abs(liquidityPayload['reserve0'] - lastPairLiquidity['reserve0'])
        liquidityPayload['token1Volume'] = Math.abs(liquidityPayload['reserve1'] - lastPairLiquidity['reserve1'])
    }
    await PairLiquidity.create(liquidityPayload)
    return null
}

const getToken24HVolume = async(tokenAddress='0x3472a5a71965499acd81997a54bba8d852c6e53d') => {
    let currentTime = time.unixTime()
    let oneDayAgo = currentTime - (60*60*24)
    currentTime = time.unixToDatetime(currentTime).toJSON()
    oneDayAgo = time.unixToDatetime(currentTime).toJSON()
    console.log(`Calculating ${tokenAddress} volume from ${oneDayAgo} to ${currentTime}`)
    const tokenPairLiquidities = await PairLiquidity.findAll({
        'where': {
            [Op.or]: [
                {'token0': tokenAddress}, 
                {'token1': tokenAddress}
            ],
            'datestamp': {
                [Op.between] : [oneDayAgo, currentTime]
            }
        }
    })
    const volumes = tokenPairLiquidities.map(
        item => item.get('token0') == tokenAddress ? item.get('token0Volume') : item.get('token1Volume')
    )
    const totalVolume = volumes.reduce((a, b) => a + b)
    console.log(`${tokenAddress} 24-hour volume across all pairs: ${totalVolume}`)
    return totalVolume
}

module.exports = {
    sequelize,
    PairLiquidity,
    createPairLiquidity,
    getToken24HVolume
}