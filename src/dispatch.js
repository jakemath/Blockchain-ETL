/*
Author: Jake Mathai
Purpose: Entrypoint script for running tasks
*/

const { config } = require('dotenv')

const time = require('./utils/time')
const { migrate } = require('./db/migrations')

const dispatch = async() => {
    let configData
    if (process.env['PROD'] == 'true') {
        await time.sleep(5)
        await migrate()
        configData = process.env
    }
    else
        configData = require('./conf')[process.env['TASK']]
    const taskFunction = configData['FUNCTION']
    if (configData['ON_CHAIN']) {
        if (configData['REQUIRES_KEY']) {
            config()
            while (process.env['PRIVATE_KEY'] == null) {
                console.log('Awaiting PRIVATE_KEY variable')
                await time.sleep(5)
                config()
            }
            console.log('Private key set')
        }
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