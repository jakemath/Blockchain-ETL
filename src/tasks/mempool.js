/*
Author: Jake Mathai
Purpose: Mempool monitoring
*/

const time = require('../utils/time')

task('mempool', 'Monitor mempool').setAction(async() => {

    let provider = null
    let gasPrices = []
    const windowLength = 200

    const listen = async() => {
        provider = new ethers.providers.WebSocketProvider(process.env.WS_URL, 'mainnet')
        provider.on('pending', async tx => {
            const txData = await provider.getTransaction(tx)
            if (txData == null)
                return
            gasPrices.push(txData.gasPrice/1e18)
            if (gasPrices.length < windowLength)
                return
            else if (gasPrices.length > windowLength)
                gasPrices.shift()
            const gasPricesSum = gasPrices.reduce((a, b) => a + b, 0.0)
            const meanGasPrice = gasPricesSum / gasPrices.length
            console.log(`Mean gas price: ${meanGasPrice} ETH`)
        });
        provider.on('error', async error => {
            console.log('Provider error:', error)
        })
        console.log('Provider initialized')
    }

    await listen()
    while (true)
        await time.sleep(60)
})
