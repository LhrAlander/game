const Hero = require('../models/Hero')
const Goods = require('../models/Goods')
const {getAllGoodsByHero: buffGetGoods} = require('./buff')
const {getAllGoodsByHero: c5GetGoods} = require('./c5')

function getAllHeros() {
  return new Promise((resolve, reject) => {
    let _heros = []
    Hero.findAll()
      .then(heros => {
        heros.forEach(hero => {
          const c5name = hero.get('c5name')
          const buffname = hero.get('buffname')
          if (c5name && buffname) {
            _heros.push({
              name: hero.get('name'),
              c5name,
              buffname
            })
          }
        })
        resolve(_heros)
      })
      .catch(err => {
        console.error(err)
        reject(err)
      })
  })
}

function flushGoodsByHero(hero) {
  let goods = []
  console.time(`查询${hero.name}`)
  return new Promise((resolve, reject) => {
    Promise.all([
      c5GetGoods(hero.c5name),
      buffGetGoods(hero.buffname),
      Goods.destroy({where: {heroname: hero.name}})
    ])
      .then(([c5Goods, buffGoods]) => {
        Object
          .keys(buffGoods)
          .forEach(name => {
            if (c5Goods[name]) {
              goods.push({
                name,
                heroname: hero.name,
                chinesename: buffGoods[name].name,
                c5sellprice: +c5Goods[name].sellPrice,
                c5purchaseprice: +c5Goods[name].purchasePrice,
                buffsellprice: +buffGoods[name].sellPrice,
                buffpurchaseprice: +buffGoods[name].purchasePrice,
                c5id: c5Goods[name].id,
                buffid: buffGoods[name].id
              })
            }
          })
        console.timeEnd(`查询${hero.name}`)
        console.log(`${hero.name}：${goods.length}件饰品`)
        Goods.bulkCreate(goods)
          .then(res => {
            resolve(res)
          })
          .catch(err => {
            console.log(err)
            reject(err)
          })
      })
      .catch(err => {
        reject(err)
      })
  })
}

async function flushGoods() {
  const heros = await getAllHeros()
  // await Goods.sync({ force: true })
  function _next() {
    if (heros.length) {
      flushGoodsByHero(heros.shift())
        .then(() => {
          // setTimeout(_next, 1000)
          _next()
        })
        .catch(err => {
          console.log(err)
        })
    }
  }

  try {
    _next()
  } catch (err) {
    console.log(err)
  }
}

module.exports = {
  getAllHeros,
  flushGoods
}