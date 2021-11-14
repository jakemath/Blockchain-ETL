/*
Author: Jake Mathai
Purpose: Entrypoint script for running tasks. Export the TASK environment variable as specified in conf.json to run the task
*/

const time = require('./utils/time')
const { migrate } = require('./db/migrations')

const dispatch = async() => {
    let configData
    if (process.env['PROD'] == 'true') {
        await migrate()
        configData = process.env
    }
    else
        configData = require('./conf')[process.env['TASK']]
    const taskFunction = configData['FUNCTION']
    if (configData['ON_CHAIN']) {
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