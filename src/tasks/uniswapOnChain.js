/*
Author: Jake Mathai
Purpose: Uniswap on-chain tasks. Example task: stream Sync and Swap events from target token pair contracts in real-time
- Sync events are recorded as Liquidity items in the DB
- Swap events are recorded as Swap items in the DB
*/

const db = require('../db/client')
const time = require('../utils/time')
const { UniswapClient } = require('../utils/uniswap')

task('streamPairs', 'Stream Uniswap pair events in real-time')
    .setAction(async() => {
        const uniswap = await UniswapClient()
        
        const targetTokens = {  // Tokens to track
            '0x3472a5a71965499acd81997a54bba8d852c6e53d': 'BADGER',
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
            '0x514910771af9ca656af840dff83e8264ecf986ca': 'LINK'
        }

        const decimals = {  // Exceptions to the standard 18-decimals (i.e. USDC)
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 12
        }

        const targetTokenAddresses = Object.keys(targetTokens)

        let provider = new ethers.providers.WebSocketProvider(process.env.WS_URL, 'mainnet')
        const syncEventTopic = ethers.utils.id('Sync(uint112,uint112)')
        const syncEventInterface = new ethers.utils.Interface(  // Sync event parser
            ['event Sync(uint112 reserve0, uint112 reserve1)']
        )
        const swapEventTopic = ethers.utils.id('Swap(address,uint256,uint256,uint256,uint256,address)')
        const swapEventInterface = new ethers.utils.Interface(  // Swap event parser
            ['event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)']
        )
        const useDB = process.env['PROD'] == 'true'

        const monitorTokenPairs = async targetTokenAddress => {
            const targetTokenSymbol = targetTokens[targetTokenAddress]
            console.log(`Fetching ${targetTokenSymbol} pairs...`)
            const pairs = await uniswap.getAllTokenPairAddresses(targetTokenAddress)
            console.log(`${pairs.length} ${targetTokenSymbol} pairs found`)
            for (const pair of pairs) {
                const pairAddress = pair['id']
                const token0Address = pair['token0']['id']
                const token0Factor = Math.pow(10, uniswap.tokenDecimals[token0Address] || decimals[token0Address] || 18)
                const token1Address = pair['token1']['id']
                const token1Factor = Math.pow(10, uniswap.tokenDecimals[token1Address] || decimals[token0Address] || 18)
                const token0Symbol = `${uniswap.tokenSymbols[token0Address] || targetTokens[token0Address] || pairAddress}`
                const token1Symbol = `${uniswap.tokenSymbols[token1Address] || targetTokens[token1Address] || pairAddress}`
                const pairSymbol = `${token0Symbol}:${token1Symbol}`
                console.log(`---> Monitoring pair ${pairSymbol}`)
                provider.once('block', async() => {  // Listen for new block
                    provider.on({  // Listen for Sync events in new block
                        'address': pairAddress,
                        'topics': [syncEventTopic]
                    }, async event => {  // Parse updated reserve levels from event and write to DB
                        try {
                            const eventData = syncEventInterface.parseLog(event).args
                            const liquidityPayload = {
                                'address': pairAddress,
                                'datestamp': time.now().toJSON(),
                                'token0': token0Address,
                                'token1': token1Address,
                                'reserve0': eventData['reserve0']/token0Factor,
                                'reserve1': eventData['reserve1']/token1Factor,
                            }
                            console.log(`${pairSymbol} SYNC:`, liquidityPayload)
                            if (useDB)
                                await db.Liquidity.create(liquidityPayload)
                        }
                        catch(e) {
                            console.log(e)
                        }
                    })
                    provider.on({  // Listen for Swap events in new block
                        'address': pairAddress,
                        'topics': [swapEventTopic]
                    }, async event => {
                        try {  // Parse Swap amounts from event and write to DB
                            const eventData = swapEventInterface.parseLog(event).args
                            const swapPayload = {
                                'address': pairAddress,
                                'datestamp': time.now().toJSON(),
                                'token0': token0Address,
                                'token1': token1Address,
                                'amount0In': eventData['amount0In']/token0Factor,
                                'amount0Out': eventData['amount0Out']/token0Factor,
                                'amount1In': eventData['amount1In']/token1Factor,
                                'amount1Out': eventData['amount1Out']/token1Factor
                            }
                            console.log(`${pairSymbol} SWAP:`, swapPayload)
                            if (useDB)
                                await db.Swap.create(swapPayload)
                        }
                        catch(e) {
                            console.log(e)
                        }
                    })
                })
            }
        }

        for (const targetTokenAddress of targetTokenAddresses) 
            monitorTokenPairs(targetTokenAddress)
        while (true)
            await time.sleep(3600)  // Keep listening processes alive
    })
