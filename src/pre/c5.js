const request = require('request')
const cheerio = require('cheerio')
const {c5: config} = require('../../config')

const cookie = 'C5Lang=en;'

function getHeros() {
  return new Promise((res, rej) => {
    const names = []
    const map = {}
    request({
      url: config.indexURL,
      headers: {
        'Cookie': cookie
      }
    }, function (err, resp, body) {
      if (err) {
        rej(err)
      }
      if (!err && body) {
        const $ = cheerio.load(body)
        $(config.heroPath)
          .each(function (i, link) {
            const hero = {
              href: $(this).attr('href').match(/hero=([^&]*)&/)[1],
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
    let goods = {}
    let totalPage = Number.MAX_SAFE_INTEGER

    function getGoodsByPagePromise(pageNum) {
      console.time('开始爬取第' + pageNum)
      return new Promise((resolve, reject) => {
        const qs = {
          hero: name,
          page: pageNum
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
              const $ = cheerio.load(body)
              const page = $(config.heroGoodsPagePath)
              if (page.length) {
                totalPage = +page.attr('href').match(/page=(\d*)/)[1]
              } else {
                totalPage = 1
              }
              const _goods = $(config.heroGoodsPath)
              if (_goods) {
                _goods.each(function (i, good) {
                  let id = $(this).attr('href').match(/\/(\d*)-/)[1]
                  let name = $(this).find('span').text()
                  if (goods[name] && goods[name].id !== id) {
                    console.log('已存在饰品', goods[name], name, id)
                  } else {
                    // goods[name] = id
                    goods[name] = {
                      hashName: name,
                      id
                    }
                  }
                })
              }
              resolve()
            } catch (err) {
              reject(err)
            }
          }
        })
      })
    }

    function getTotalPage() {
      return new Promise((resolve, reject) => {
        getGoodsByPagePromise(pageNum)
          .then(() => {
            pageNum++
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
        .then(() => {
          gRes(goods)
        })
        .catch(err => {
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