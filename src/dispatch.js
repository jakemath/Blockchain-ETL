/*
Author: Jake Mathai
Purpose: Entrypoint script for running tasks. 
Reads the TASK environment variable, which maps to task-specific configurations defined in conf.json
*/

const { migrate } = require('./db/migrations')

const dispatch = async() => {
    const configData = require('./conf')[process.env['TASK']]
    if (process.env['PROD'] == 'true')  // If prod --> migrate DB
        await migrate()
    const taskFunction = configData['function']
    if (configData['onChain'] == 'true') {  // If on-chain --> run in hardhat runtime environment
        const hre = require('hardhat')
        await hre.run(taskFunction)
    }
    else {  // If off-chain --> import and execute as a normal node.js function
        const taskModule = require('./' + configData['module'])
        const taskArgs = configData['args'] || []
        await taskModule[taskFunction](...taskArgs)
    }
}

dispatch().then(() => {
    process.exit(0)
}).catch(error => {
    console.error(error)
    process.exit(1)
})