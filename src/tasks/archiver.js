/*
Author: Jake Mathai
Purpose: Listen for new contract deployments and attempt to decode bytecode into opcodes
*/

const time = require('../utils/time')
const decompiler = require('../utils/decompiler')

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
            try {
                deploymentEvent['opcodes'] = decompiler.toOpcode(bytecode)
            }
            catch(e) {
                console.log(time.now(), e)
            }
            console.log(time.now(), deploymentEvent)
        }
        catch(e) {
            
        }
    }

    let provider = null

    const listen = async() => {
        provider = new ethers.providers.WebSocketProvider(process.env.WS_URL, 'mainnet')
        provider.on('block', async blockNumber => {
            console.log(time.now(), 'New block:', blockNumber)
            const block = await provider.getBlockWithTransactions(blockNumber)
            for (const transaction of block.transactions)
                inspectTransaction(provider, transaction)
        })
        provider.on('error', async error => {
            console.log('Provider error:', error)
            provider = null
        })
        console.log(time.now(), 'Provider initialized')
    }

    await listen()
    while (true) {
        await time.sleep(60)
        if (provider == null)
            await listen()
    }
})

