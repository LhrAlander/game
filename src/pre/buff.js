const request = require('request')
const cheerio = require('cheerio')
const {buff: config} = require('../../config')

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

module.exports = {
  getHeros
}