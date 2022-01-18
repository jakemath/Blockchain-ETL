/*
Author: Jake Mathai
Purpose: Listen for new contract deployments and attempt to decode bytecode into opcodes
*/

const { EVM } = require('evm');

const time = require('../utils/time')

task('archiver', 'Decompiles newly deployed contracts').setAction(async() => {

    const inspectTransaction = async(provider, transaction) => {
        try {
            const receipt = await transaction.wait()
            if (receipt == null || receipt.to != null)
                return null
            const contractAddress = receipt.contractAddress
            const bytecode = await provider.getCode(contractAddress)
            let deploymentEvent = {
                'txHash': transaction.hash,
                'deployer': receipt.from,
                'contractAddress': contractAddress,
                'bytecode': bytecode,
            }
            const evm = new EVM(bytecode)
            try {
                deploymentEvent['opcodes'] = evm.getOpcodes()
                deploymentEvent['functions'] = evm.getFunctions()
                deploymentEvent['events'] = evm.getEvents()
                deploymentEvent['decompile'] = evm.decompile()
            }
            catch(e) {
                console.log(e)
            }
            console.log(deploymentEvent)
        }
        catch(e) {
            
        }
    }

    let provider = null

    const listen = async() => {
        provider = new ethers.providers.WebSocketProvider(process.env.WS_URL, 'mainnet')
        provider.on('block', async blockNumber => {
            console.log('New block:', blockNumber)
            const block = await provider.getBlockWithTransactions(blockNumber)
            for (const transaction of block.transactions)
                inspectTransaction(provider, transaction)
        })
        provider.on('error', async error => {
            console.log('Provider error:', error)
        })
        console.log('Provider initialized')
    }

    await listen()
    while (true)
        await time.sleep(60)
})

