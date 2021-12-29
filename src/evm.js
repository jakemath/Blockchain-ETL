const { EVM } = require("evm");
const Web3 = require('web3');
 
(async() => {
    web3 = new Web3(new Web3.providers.WebsocketProvider('wss://mainnet.infura.io/ws/v3/61bee94f08184b74ad949ff1e125a730'));
    code = await web3.eth.getCode("0xd784927Ff2f95ba542BfC824c8a8a98F3495f6b5")
    evm = new EVM(code)
    console.log(evm.getOpcodes())
    console.log(evm.getFunctions())
    console.log(evm.getEvents())
    // console.log(evm.decompile())
})()
