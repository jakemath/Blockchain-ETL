# UniswapETL
Basic ETL pipeline for streaming and storing data from Uniswap V2 using Hardhat, Ethers.js & PostgreSQL.

## Setup
Ensure you have the latest versions of npm and node.js installed. Clone the project:

`git clone -b dev git@github.com:jakemath/UniswapETL.git`

Move into the project directory and download the dependencies:

`cd UniswapETL && npm install`

Create a `.env` file and paste the wallet private key you would like to use to sign transactions on the blockchain.

### .env
`PRIVATE_KEY=MY_PRIVATE_KEY`


