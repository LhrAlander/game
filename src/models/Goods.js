const Sequelize = require('sequelize')
const sequelize = require('../utils/db')
const Model = Sequelize.Model

class Goods extends Model {
}

Goods.init({
  id: {
    unique: true,
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER,
    allowNull: false
  },
  heroname: {
    unique: false,
    type: Sequelize.STRING(15),
    allowNull: false
  },
  name: {
    unique: true,
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  chinesename: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  c5id: {
    unique: false,
    type: Sequelize.STRING(45),
    allowNull: true
  },
  buffid: {
    unique: false,
    type: Sequelize.STRING(45),
    allowNull: true
  },
  c5sellprice: {
    type: Sequelize.DOUBLE
  },
  c5purchaseprice: {
    type: Sequelize.DOUBLE
  },
  buffsellprice: {
    type: Sequelize.DOUBLE
  },
  buffpurchaseprice: {
    type: Sequelize.DOUBLE
  }
}, {
  sequelize,
  modelName: 'goods',
  timestamps: true,
  tableName: 'goods'
})

module.exports = Goods
