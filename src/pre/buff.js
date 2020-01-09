const request = require('request')
const cheerio = require('cheerio')
const {buff: config} = require('../../config')
const login = require('../login/buff')

let cookie = ''

function getHeros() {
  return new Promise((res, rej) => {
    const names = []
    const map = {}
    request({
      url: config.indexURL
    }, function (err, resp, body) {
      if (err) {
        rej(err)
      }
      if (!err && body) {
        const $ = cheerio.load(body)
        $(config.heroPath)
          .each(function (i, link) {
            const hero = {
              href: $(this).attr('value').match(/npc_dota_hero_(.*)/)[1],
              name: $(this).attr('title')
            }
            names.push(hero)
            map[hero.name] = hero.href
          })
        res({
          map,
          names
        })
      }
    })
  })
}

function getAllGoodsByHero(name) {
  return new Promise((gRes, gRej) => {
    let pageNum = 1
    let pageSize = 300
    let goods = {}
    let totalPage = Number.MAX_SAFE_INTEGER

    function getGoodsByPagePromise(pageNum) {
      return new Promise((resolve, reject) => {
        const qs = {
          game: 'dota2',
          'page_num': pageNum,
          'page_size': pageSize,
          hero: 'npc_dota_hero_' + name,
          search: '',
          _: +new Date()
        }
        request({
          url: config.heroGoodsURL,
          qs,
          json: true,
          headers: {
            'Cookie': cookie
          }
        }, async function (err, resp, body) {
          if (err) {
            reject(err)
          } else {
            try {
              if (!body.data) {
                console.log(body)
                if (body.code && body.code === 'Login Required') {
                  login().then(_cookie => {
                    cookie = _cookie
                    getAllGoodsByHero(name)
                      .then(items => gRes(items))
                      .catch(err => gRej(err))
                  })
                }
              } else {
                if (body.data['total_page'] !== totalPage) {
                  totalPage = body.data['total_page']
                }
                resolve(body.data.items)
              }
            } catch (e) {
              reject(e)
            }
          }
        })
      })
    }

    function dealItems(items) {
      if (
        !items ||
        Array.isArray(items) && !items[0]
      ) {
        return
      }
      if (!Array.isArray(items)) {
        items = [items]
      }
      if (!Array.isArray(items[0])) {
        items = [items]
      }
      items.forEach(item => {
        item.forEach(_ => {
          if (goods[_['market_hash_name']] && goods[_['market_hash_name']].id !== _.id) {
            console.log('buff已存在饰品', goods[_.name], _.name, _.id)
          } else {
            // goods[_.name] = _.id
            goods[_['market_hash_name']] = {
              name: _.name,
              id: _.id,
              hashName: _['market_hash_name'],
              sellPrice: _['sell_min_price'],
              purchasePrice: _['buy_max_price']
            }
          }
        })
      })
    }

    function getTotalPage() {
      return new Promise((resolve, reject) => {
        getGoodsByPagePromise(pageNum)
          .then(res => {
            pageNum++
            dealItems(res)
            resolve()
          })
          .catch(err => {
            reject(err)
          })
      })
    }

    function getAllGoods() {
      const promises = []
      while (pageNum <= totalPage) {
        promises.push(getGoodsByPagePromise(pageNum++))
      }
      Promise.all(promises)
        .then(items => {
          dealItems(items)
          gRes(goods)
        })
        .catch(err => {
          console.log(err)
          gRej(err)
        })
    }
    getTotalPage()
      .then(getAllGoods)
      .catch(err => {
        gRej(err)
      })
  })
}

module.exports = {
  getHeros,
  getAllGoodsByHero
}

const record = {
  status: 'refuse',
  name: '咆哮之心',
  sellPrice: '2.34',
  purchaisePrice: '1.89'
}