#!/bin/bash
# Author: Jake Mathai
# Purpose: Stream container logs
cd src
sudo docker-compose logs -f -t --tail 100