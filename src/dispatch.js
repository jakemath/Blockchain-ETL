/*
Author: Jake Mathai
Purpose: Entrypoint script for running tasks. Reads the TASK environment variable mapping to configurations in conf.json
*/

const dispatch = async() => {
    const configData = require('./conf/tasks.json')[process.argv[2] || process.env['TASK']]
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