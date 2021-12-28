#!/bin/bash
# Author: Jake Mathai
# Purpose: Run all containers in docker-compose.yml, then stream logs
TASK=$1
cd src
cp conf/${TASK}.yml .
sudo docker-compose -f ${TASK}.yml up -d --remove-orphans --build
sudo docker-compose -f ${TASK}.yml logs -f -t
rm ${TASK}.yml