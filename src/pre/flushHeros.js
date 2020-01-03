const buff = require('./buff')
const c5 = require('./c5')
const Hero = require('../models/Hero')

function flushHeros() {
  Promise.all([c5.getHeros(), buff.getHeros()])
    .then(([c5Res, buffRes]) => {
      const common = []
      for (let key in c5Res.map) {
        const c5name = c5Res.map[key]
        if (key === '嗜血狂魔') {
          key = '血魔'
        }
        if (buffRes.map[key]) {
          common.push({
            name: key,
            c5name,
            buffname: buffRes.map[key]
          })
          delete buffRes.map[key]
        } else {
          common.push({
            name: key,
            c5name,
            buffname: ''
          })
        }
        delete c5Res.map[key]
      }
      for (let key in buffRes.map) {
        common.push({
          name: key,
          c5name: '',
          buffname: buffRes.map[key]
        })
      }
      for (let key in common) {
        if (common[key].c5url !== common[key].buffurl) {
          console.log(common[key])
        }
      }
      Hero
        .sync({force: true})
        .then(() => {
          console.log('true')
          Hero.bulkCreate(common)
            .then(res => {
              console.log('插入成功')
            })
            .catch(err => {
              console.log('失败', err)
            })
        })
        .catch(err => {
          console.log(err)
        })
    })
}

module.exports = flushHeros
