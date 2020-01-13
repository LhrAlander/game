const {getAllGoodsByHero: getBuffGoods} = require('../pre/buff')
const {getAllGoodsByHero: getC5Goods} = require('../pre/c5')
const Goods = require('../models/Goods')

Promise
  .all([
    getBuffGoods('axe'),
    getC5Goods('axe')
  ])
  .then(([buffGoods, c5Goods]) => {
    const finalRes = []
    Object
      .keys(buffGoods)
      .forEach(name => {
        if (c5Goods[name]) {
          finalRes.push({
            name,
            heroname: '斧王',
            chinesename: buffGoods[name].name,
            c5sellprice: +c5Goods[name].sellPrice,
            c5purchaseprice: +c5Goods[name].purchasePrice,
            buffsellprice: +buffGoods[name].sellPrice,
            buffpurchaseprice: +buffGoods[name].purchasePrice,
            c5id: c5Goods[name].id,
            buffid: c5Goods[name].id
          })
        }
      })
    Goods.sync({ force: true })
      .then(() => {
        Goods.bulkCreate(finalRes)
          .then(() => console.log('插入成功'))
          .catch(err => console.log(err, '插入失败'))
      })
  })
