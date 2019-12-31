const request = require('request')
const cheerio = require('cheerio')
const {c5: config} = require('../../config')

const cookie = 'C5Lang=zh;'

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

module.exports = {
  getHeros
}