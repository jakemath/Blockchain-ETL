# Crypto ETL
Node.js crypto data ETL framework for streaming and storing data from on and off-chain sources using Node.js, Hardhat & Ethers.js. Includes sample on and off-chain data streaming implementations for Uniswap V2.

## Available Tasks
```
1. track-tokens (off-chain)
    - Polls Uniswap V2 subgraph for updates to target token's Token entity
    - Writes entity updates to DB as TokenObservations
    - Calculates 24-hour liquidity and volume from TokenObservations
2. track-pairs (on-chain) 
    - Streams events emitted from all Pair contracts for target tokens
```

## Setup
Clone the project:

```bash
cd ~/
git clone https://github.com/jakemath/Crypto-ETL
```

### Quickstart - Containerized
Ensure you have the latest versions of `docker` & `docker-compose` on your machine. 

Move into the project directory and run the containers:

```bash
cd ~/Crypto-ETL
bash run.sh
```

This will build and run the relevant task containers defined in `docker-compose.yml` using `docker-compose`.

#### Run Tests
Once the containers are built, you can run the tests via
```bash
bash test.sh
```

#### Stream Logs
In the containerized deployment, logs from all containers will automatically be streamed to the console. You can manually stream the logs via
```bash
bash stream_logs.sh
```

#### Terminate All Tasks
Stop and remove all containers
```bash
bash stop.sh
```

#### Clear Cache
Wipe all Docker images, container data, and volumes (WARNING: clears all database data as well)
```bash
bash cleanup.sh
```

### Quickstart - Local
You can also run a task directly on your machine to observe and debug a task - note that the database cannot be utilized in this mode. You will need `node.js >= 16.8` and `npm` installed on your machine.

Ensure the `PROD` variable is unset:
```bash
unset PROD
```
Download the project packages:
```bash
cd ~/Crypto-ETL/src
npm install
```
Export the TASK variable as the name of the task you want to run (`track-tokens` in this example) and run `dispatch.js` - this is the main entrypoint script automatically executed in the containerized deployment:
```bash
cd ~/Crypto-ETL
export TASK=track-tokens
node dispatch.js
```

Both of these execution methods will stream Uniswap data in real-time!

## Architecture

This project is a single-host framework for processing multiple data feeds and jobs concurrently. Data feeds and processes are referred to as `tasks`, and are specified with the `TASK` environment variable. Each container sets this variable, which maps to configurations specified in `src/conf.json`. 

### Task Configuration - `src/conf.json`
```json
{
    "task-name": {
        "module": "path/to/task/module",
        "function": "functionName",
        "args": [],
        "onChain": "true or false",
    }
}
```
This configuration can be customized to one's needs - the same task function can be called via multiple tasks with either the same or different function arguments.

The `onChain` key specifies whether the task should be run using the Hardhat Runtime Environment. This enables lower-level blockchain interactions leveraging Hardhat and Ethers.js. These tasks should be defined as hardhat tasks and imported into `hardhat.config.js`. See `src/tasks/uniswapOnChain.js` for an example.

### Docker Image
Task containers are built with a `node.js` base image - the `package.json` file further specifies Hardhat and Ethers.js as dependencies. These libraries enable one to interact with blockchain networks at low levels - see `src/tasks/uniswapOnChain.js` for an example.

### Docker Compose
Each distinct task should be added as a distinct service in `docker-compose.yml`. Unless otherwise specified, all task containers share the same `node_modules` folder as a mounted volume. This means project dependencies only need to be downloaded once in deployment, regardless of the number of tasks.

Alongside the task containers is the `db` container, which is built using the `postgresql` base image. This serves as the database for all tasks. The ORM client can be accessed and configured via `src/db/client.js`. 

### Database Schema
The `TokenObservation` schema corresponds to observed Token entities in the Uniswap V2 Subgraph, given a target token to track.
##### TokenObservation
```json
{
    "address": {
        "type": "STRING",
        "allowNull": false,
        "primaryKey": true
    },
    "datestamp": {
        "type": "DATE",
        "allowNull": false,
        "primaryKey": true
    },
    "totalTokenVolume": {
        "type": "DECIMAL",
        "allowNull": false
    },
    "totalTokenLiquidity": {
        "type": "DECIMAL",
        "allowNull": false
    },
    "price": {
        "type": "DECIMAL",
        "allowNull": false
    }
}
```
The `TokenObservation` items are used to calculate USD-denominated liquidity and volume for all pairs across any timespan given a target token. See `getTokenLiquidityAndVolume` in `src/utils/uniswap.js` for calculation methodology.

### Single-Host Architecture
![Design](design.png)

By supporting many different data feeds on the same machine, the single-host architecture effectively maximizes server resources. A true production-grade data platform, however, may seek to decouple the various components into a distributed system, like the diagram below illustrates.

### Distributed Architecture
![Distributed Design](distributed_design.png)

In the distributed architecture, all individual components are decoupled into their own services across various nodes. This architecture could be built using a multi-host container orchestration service such as Kubernetes or Docker Swarm. 

An additional key feature in this architecture is the message queue service (RabbitMQ in this example). Message queue architectures are especially powerful for data platforms due to their scalability and flexibility. Among other things, a message queue allows horizontal scalability, asynchronous execution of tasks such as writing data to a database, and, in the case of task failure, automatic retries with exponential backoff.

The distributed architecture is built to scale.
