#!/bin/bash
# Author: Jake Mathai
# Purpose: Stream container logs
TASK=$1
cd src
cp conf/${TASK}.yml .
sudo docker-compose -f ${TASK}.yml logs -f -t --tail 100
rm ${TASK}.yml
