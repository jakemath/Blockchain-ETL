/*
Author: Jake Mathai
Purpose: Hardhat conf
*/

require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-truffle5')
require('@openzeppelin/hardhat-upgrades')

require('./tasks/uniswap')

process.env.WS_URL = 'wss://mainnet.infura.io/ws/v3/fd5e5e74da73453195b8404558bffbf8'

module.exports = {
  'solidity': '0.8.4',
  'networks': {
    'mainnet': {
      'url': 'https://mainnet.infura.io/v3/fd5e5e74da73453195b8404558bffbf8',
      'chainId': 1,
    }
  },
  'defaultNetwork': 'mainnet',
  'namedAccounts': {
    'deployer': {
      'default': 0,
      1: 0
    }
  }
};
