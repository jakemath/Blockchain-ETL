# Author: Jake Mathai
# Purpose: Node.js dockerfile

FROM node:16.8
WORKDIR /src
COPY . ./
# RUN apk update
# RUN apk add git
RUN rm -rf node_modules package-lock.json
RUN npm install
