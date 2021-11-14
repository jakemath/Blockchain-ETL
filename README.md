# UniswapETL
Basic ETL pipeline written in Node.js for streaming and storing data from Uniswap V2 using Hardhat, Ethers.js & PostgreSQL.

## Quickstart
Ensure you have the latest version of `docker` & `docker-compose` on your machine. Clone the project:

`git clone -b dev git@github.com:jakemath/UniswapETL.git`

Move into the project directory and run the containers:

`cd UniswapETL && bash run.sh`

This will immediately build and run the relevant project containers using `docker-compose`.

Once the project is finished building, you will be streaming near real-time data from Uniswap! 

## Architecture

