/*
Author: Jake Mathai
Purpose: Entrypoint script for running tasks. 
Reads the TASK environment variable, which maps to task-specific configurations defined in conf.json
*/

const time = require('./utils/time')
const { migrate } = require('./db/migrations')

const dispatch = async() => {
    const configData = require('./conf')[process.env['TASK']]
    if (process.env['PROD'] == 'true')  // If prod --> migrate DB
        await migrate()
    const taskFunction = configData['FUNCTION']
    if (configData['ON_CHAIN'] == 'true') {
        const hre = require('hardhat')
        await hre.run(taskFunction)
    }
    else {
        const taskModule = require('./' + configData['MODULE'])
        const taskArgs = configData['ARGS'] || []
        await taskModule[taskFunction](...taskArgs)
    }
}

dispatch().then(() => {
    process.exit(0)
}).catch(error => {
    console.error(error)
    process.exit(1)
})