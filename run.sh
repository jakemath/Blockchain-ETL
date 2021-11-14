#!/bin/bash
# Author: Jake Mathai
# Purpose: Run all containers in docker-compose.yml, then stream logs
sudo docker-compose up -d --remove-orphans --build
sudo docker-compose logs -f -t