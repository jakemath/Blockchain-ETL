# Crypto ETL
Crypto data ETL framework for streaming and storing data from on and off-chain sources using Hardhat, Ethers.js & PostgreSQL. Includes an implementation for Uniswap V2 data streaming.

## Setup
Ensure you have the latest versions of `docker` & `docker-compose` on your machine. Clone the project:

```bash
cd ~/
git clone https://github.com/jakemath/Crypto-ETL
```

### Quickstart - Prod Mode
Move into the project directory and run the containers:

```bash
cd ~/Crypto-ETL
bash run.sh
```

This will build and run the relevant task containers defined in `docker-compose.yml` using `docker-compose`.

Once the build completes, you'll be streaming real-time data from Uniswap! 

### Quickstart - Local
You can also run a task directly on your machine to observe and debug a task - note that the database cannot be utilized in this mode. Ensure you have a `node.js` version `>= 16.8` and `npm` installed on your machine.

Ensure the `PROD` variable is not set

```
unset PROD
```

Download the project packages
```bash
cd ~/Crypto-ETL/src
npm install
```

Export the TASK variable as the name of the task you want to run (`uniswap` in this example) and run `dispatch.js` (main entrypoint script automatically executed in prod mode by `docker-compose`):
```bash
cd ~/Crypto-ETL
export TASK=uniswap
node dispatch.js
```

## Architecture

This framework is designed to concurrently stream many data feeds on the same host. In production mode, each distinct data feed is deployed in its own docker container with the `TASK` environment variable set to the name of the respective task. 

A task name maps to configurations specified in `src/conf.json`, which can be customized to one's needs.

![Design](design.png)
