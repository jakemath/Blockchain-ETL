#!/bin/bash
# Author: Jake Mathai
# Purpose: Stop running containers defined in docker-compose.yml
TASK=$1
cd src
cp conf/${TASK}.yml .
sudo docker-compose -f ${TASK}.yml down
rm ${TASK}.yml
