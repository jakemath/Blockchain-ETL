# Author: Jake Mathai
# Purpose: Node.js-based dockerfile for task containers
FROM node:16.8
WORKDIR /src
COPY . ./
RUN rm -rf node_modules || true
RUN rm -rf package-lock.json || true
RUN npm install
