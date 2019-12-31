const Sequelize = require('sequelize')
const sequelize = require('../utils/db')
const Model = Sequelize.Model

class Hero extends Model {
}

Hero.init({
  id: {
    unique: true,
    autoIncrement: true,
    primaryKey: true,
    type: Sequelize.INTEGER,
    allowNull: false
  },
  name: {
    unique: true,
    type: Sequelize.STRING(15),
    allowNull: false
  },
  c5name: {
    unique: false,
    type: Sequelize.STRING(45),
    allowNull: true
  },
  buffname: {
    unique: false,
    type: Sequelize.STRING(45),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'hero',
  timestamps: false,
  tableName: 'hero'
})

module.exports = Hero
