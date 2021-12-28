#!/bin/bash
# Author: Jake Mathai
# Purpose: Stop running containers and wipe all images & volumes
TASK=$1
cd src
cp conf/containers/${TASK}.yml .
sudo docker-compose -f ${TASK}.yml down
sudo docker system prune --force --all --volumes
rm ${TASK}.yml
