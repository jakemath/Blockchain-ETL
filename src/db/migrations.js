/*
Author: Jake Mathai
Purpose: RDBMS migrations
*/

const db = require('./client')

const migrate = async() => await db.sequelize.sync()

module.exports = {
    migrate
}
