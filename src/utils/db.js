const Sequelize = require('sequelize')

const sequelize = new Sequelize('game', 'admin', '@_Hr914588', {
  host: '120.27.243.197',
  dialect: 'mysql'
})

module.exports = sequelize