const request = require('request')
const login = require('../login/buff')

class BuffRobot {
  constructor(steamBot) {
    if (!steamBot) {
      return console.log('必须配置steam机器人')
    }
    this.steamBot = steamBot
    this.islogin = false
    this.loginDep = []
  }


  login() {
    return new Promise((gRes, gRej) => {
      this.loginDep.push({
        res: gRes,
        rej: gRej
      })
      if (!this.islogin) {
        this.islogin = true
        login(this.steamBot)
          .then(cookie => {
            this.cookie = cookie
            this.loginDep.forEach(dep => dep.res())
            this.islogin = false
          })
          .catch(err => {
            this.loginDep.forEach(dep => dep.rej(err))
            this.islogin = false
          })
      }

    })
  }

  getPriceInfo(id) {
    const that = this
    function getSaleRequest(isSale, isQuick) {
      let url = `https://buff.163.com/api/market/goods/sell_order?game=dota2&goods_id=${id}&page_num=1&sort_by=price.asc&mode=${isQuick ? 1 : 2}&allow_tradable_cooldown=1&_=${+new Date()}`
      if (!isSale) {
        url = `https://buff.163.com/api/market/goods/buy_order?game=dota2&goods_id=${id}&page_num=1&_=${+new Date()}`
      }
      return new Promise((res, rej) => {
        request(url, {json: true, headers: {Cookie: that.cookie}}, (err, resp, body) => {
          if (err) {
            rej(err)
          } else {
            if (body.code === 'OK') {
              let items = body.data.items
              if (items.length) {
                res(items[0])
              } else {
                res(null)
              }
            } else {
              rej(body)
            }
          }
        })
      })
    }

    return new Promise((gRes, gRej) => {
      let _res = {
        manual: null,
        quick: null,
        purchase: null
      }
      Promise.all([
        getSaleRequest(true, true),
        getSaleRequest(true, false),
        getSaleRequest(false)
      ])
        .then(([quickItem, manualItem, purchaseItem]) => {
          _res.manual = manualItem
          _res.quick = quickItem
          _res.purchase = purchaseItem
          gRes(_res)
        })
        .catch(err => {
          if (err.code === 'Login Required') {
            console.log('catchErr', err)
            this.login()
              .then(() => this.getPriceInfo(id))
              .then(gRes)
              .catch(err)
          } else {
            gRej(err)
          }
        })
    })
  }
}

module.exports = BuffRobot