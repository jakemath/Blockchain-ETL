/*
Author: Jake Mathai
Purpose: Time utils
*/

const now = () => new Date()

const sleep = async seconds => await new Promise(r => setTimeout(r, seconds*1000))

const unixTime = () => Math.floor(Date.now() / 1000)

const unixToDatetime = unixTimestamp => new Date(unixTimestamp*1000)

module.exports = {
    now, 
    unixTime,
    unixToDatetime,
    sleep
}
