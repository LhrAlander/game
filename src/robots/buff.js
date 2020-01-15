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
    this.cookie = `Device-Id=edMtezr8OApolvSVVlRt; NTES_YD_SESS=xbXbOLxLgTR1WZ_r.5eMnkeNX8KyVe.BPXZbI.SuI2qFlgDdIRry4Uqkv35bLxgy92PJ_s_4JeE38TCN4XkWkZsWNeO9WzhH_fGaq6dTicukO4jpcr7FcpvqQSuA4ys3ooExxWSSAeuuBwNer5QPRvRsVTUnf6qbciqv.LVDwLJmVeu20Z.XE2wMmTVBxNUvVBdge.rDXvq31BiWqUVybWvGJ42cLcRCT5dINV3XkTMDH; S_INFO=1579058038|0|3&80##|13588737694; P_INFO=13588737694|1579058038|1|netease_buff|00&99|zhj&1579055933&netease_buff#zhj&330100#10#0#0|&0|null|13588737694; session=1-quFl8hGu3e6leTwcS0DaHpf7jpewcOl5yuYXVAHQ5RlF2046469057; Locale-Supported=zh-Hans; game=csgo; _ga=GA1.2.1632031904.1579058041; _gid=GA1.2.246224964.1579058041; csrf_token=IjhmYzM3ZjNmY2RhZmFkYmY1ZTlmNmZjNWE4MGY1MWVmOGExMGJmNTUi.EQA8ug.4w2sHqCO3_U1jlVMPYpW7uHTuUw`
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
            console.log('buff登录成功', this.cookie)
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
            console.log('buff获取价格失败', err)
            gRej(err)
          }
        })
    })
  }
}

module.exports = BuffRobot