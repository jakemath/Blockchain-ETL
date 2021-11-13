/*
Author: Jake Mathai
Purpose: DB migration processes
*/

const db = require('./client')

const migrate = async() => await db.sequelize.sync()

module.exports = {
    migrate
}
