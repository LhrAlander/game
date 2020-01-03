const request = require('request')
const cheerio = require('cheerio')
const {buff: config} = require('../../config')

const cookie = '_ntes_nuid=7501d6456ee350b5b2e13db96e121b42; _ntes_nnid=7501d6456ee350b5b2e13db96e121b42,1571967026084; mail_psc_fingerprint=822a424627f833d9574312af4a58b30f; nts_mail_user=AlanderLt@163.com:-1:1; Device-Id=BFqMzY8OEl287T1Xh6SW; _ga=GA1.2.1753586414.1577773778; _gid=GA1.2.2146132853.1577931675; Locale-Supported=zh-Hans; game=dota2; NTES_YD_SESS=2FiD5q9_oKmR8arhl0UnSDfsRg4dw1dyE4_vEDA9Eq1tfl7UEgWpjV1uFGSvH2lp0qrLOIOjLKnGYk5.j4udu_Id.Kh0di3BOaQw1JUkTN9uhjM8NWstN8F1XA9PjpIGxxn22dAAPK99oC.KWSXrgFgIbkVZaJ1vNT1FDHb7CHLTxa2C_na.cH.u9amJ3nmUSMtpeztVt8E5tyGsSugx6cFQLjqNHNg5kSUE.bG4uke7B; S_INFO=1578035582|0|3&80##|13588737694; P_INFO=13588737694|1578035582|1|netease_buff|00&99|zhj&1577931730&netease_buff#zhj&330100#10#0#0|&0|null|13588737694; session=1-CD5kaPItpjXql6hEYEPP2ZjD1RdDJrEGr_MB_UYqBWXq2046469057; _gat_gtag_UA_109989484_1=1; csrf_token=IjI4YjdjZGJhZjBkNTZlMWU3NWIyODExYjk0NDNjOGIyZGUxY2VhMzki.EPCBAQ.McxTqOPsgXAfIZjbRsdIZalKkpQ'

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
        }, function (err, resp, body) {
          if (err) {
            reject(err)
          } else {
            try {
              if (!body.data) {
                console.log(body)
              }
              if (body.data['total_page'] !== totalPage) {
                totalPage = body.data['total_page']
              }
              resolve(body.data.items)
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