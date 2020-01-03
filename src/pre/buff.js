const request = require('request')
const cheerio = require('cheerio')
const {buff: config} = require('../../config')

const cookie = '_ntes_nnid=7501d6456ee350b5b2e13db96e121b42,1571967026084; _ntes_nuid=7501d6456ee350b5b2e13db96e121b42; mail_psc_fingerprint=822a424627f833d9574312af4a58b30f; nts_mail_user=AlanderLt@163.com:-1:1; Device-Id=BFqMzY8OEl287T1Xh6SW; _ga=GA1.2.1753586414.1577773778; _gid=GA1.2.2146132853.1577931675; Locale-Supported=zh-Hans; game=dota2; NTES_YD_SESS=hdCgNMJI2aSmJyZyjNtb0e3htGyIQnrtQcdRPCueP3Glq25pPxmLN8GMgvkRnh2LK30EUAUNE7rvBjTwNcMyMdAyw7VKyXbZU1FzGIpj4aeMVN.HamSlaHgGtue9NLAvOOrhhyuu97ee_iw7mkt0xgxAYj8W1IGRa4GgCnY5inEGjE4bHzlmeQxraAe5lx1nHoKTEnO0Tq6N7wxyGREcuU2FEN3anaxTjkpPwYvcMjD5Z; S_INFO=1577947918|0|3&80##|13588737694; P_INFO=13588737694|1577947918|1|netease_buff|00&99|null&null&null#zhj&330100#10#0#0|&0|null|13588737694; session=1-deztIMygF_vFUlKPHlMvtz3QKhmUM69q0sypdPeQ7W0R2046469057; _gat_gtag_UA_109989484_1=1; csrf_token=IjQyMDViOTk5ODQ5YTQ4NDczMzk0Mjk0NGEyYjNjOWE5ZGU5NThlNDgi.EO8k6A._a8sL8w0TJI99tqggelfhmNi-Wc'

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
              hashName: _['market_hash_name']
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