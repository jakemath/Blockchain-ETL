#!/bin/bash
sudo docker-compose up -d --remove-orphans --build
sudo docker-compose logs -f -t