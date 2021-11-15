/*
Author: Jake Mathai
Purpose: Time utilities
*/

const now = () => new Date()

const sleep = async seconds => await new Promise(r => setTimeout(r, seconds*1000))

const datetimeToUnix = (date=now()) => Math.floor(date / 1000)

const unixTime = datetimeToUnix

const unixToDatetime = unixTimestamp => new Date(unixTimestamp*1000)

module.exports = {
    now, 
    datetimeToUnix,
    unixTime,
    unixToDatetime,
    sleep
}
