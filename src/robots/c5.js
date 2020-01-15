const fs = require('fs')
const request = require('request')
const cheerio = require('cheerio')

const login = require('../login/c5')
const USER_INFO_URL = 'https://www.c5game.com/user.html'

class C5Robot {

  constructor(steamBot) {
    this.cookie = 'howNewUser=1; C5Machines=Ye9OWJwp704CrAWOZvzckg%3D%3D; C5NoticeBounces62=close; c5user=13588737694; C5Appid=570; C5Lang=en; device_id=beefcdd7e6bc666a053c95ae8aa36790; Hm_lvt_86084b1bece3626cd94deede7ecf31a8=1578480103,1578535971,1578547461,1578881088; C5SessionID=r02m839go602odgnos628ppr25; C5Sate=484d0266208de62a8ecbc6e6a9ef186b12ce5730a%3A4%3A%7Bi%3A0%3Bs%3A9%3A%22554100987%22%3Bi%3A1%3Bs%3A15%3A%22qq_0b6dbe27819e%22%3Bi%3A2%3Bi%3A259200%3Bi%3A3%3Ba%3A0%3A%7B%7D%7D; C5Token=5e1bd0abd812e; C5Login=554100987; c5IsBindPhone=1; C5_NPWD=4PtY4n8jbUfgL2eb%2FyIEXg%3D%3D; Hm_lpvt_86084b1bece3626cd94deede7ecf31a8=1578888447'
    if (!steamBot) {
      console.error('必须添加对应的Steam机器人')
    }
    this.steamBot = steamBot
    this.isLogin = false
  }

  isLoginPage(htmlText) {
    const $ = cheerio.load(htmlText)
    let loginForm = $('#modal-user-login')
    return !!loginForm.length
  }

  login() {
    return new Promise(async (gRes, gRej) => {
      if (this.isLogin) {
        gRes()
      } else {
        this.isLogin = true
        try {
          login(this.steamBot)
            .then(cookie => {
              this.cookie = cookie
              this.isLogin = false
              gRes()
            })
            .catch(e => {
              gRej(e)
            })
        } catch (e) {
          this.isLogin = false
          gRej(e)
        }
      }
    })
  }

  // 获取账户余额
  getCash() {
    function parseHtml(htmlText) {
      const $ = cheerio.load(htmlText)
      const path = '.account-amount .amount'
      let amount = $(path)
      amount = amount.slice(1, 3)
      const res = {}
      amount.each(function () {
        let name = $(this).find('p + p').text().trim()
        let count = $(this).find('p span').text().trim()
        if (name === 'Cash') {
          res.cash = +count
        } else if (name.includes('可提现余额')) {
          res.available = +count
        }
      })
      return res
    }

    return new Promise((gRes, gRej) => {
      request({
        url: USER_INFO_URL,
        headers: {
          Cookie: this.cookie
        }
      }, (err, resp, body) => {
        if (err) {
          gRej(err)
        } else {
          fs.writeFileSync('login.html', body)
          if (this.isLoginPage(body)) {
            this.login()
              .then(() => this.getCash())
              .then(gRes)
              .catch(gRej)
          } else {
            gRes(parseHtml(body))
          }
        }
      })
    })
  }

  // 获取饰品价格信息
  getPriceInfo(id) {
    const that = this

    function getApiId(isSale) {
      const url = `https://www.c5game.com/dota/${id}-${isSale ? 'S' : 'P'}.html`
      return new Promise((res, rej) => {
        request(url, (err, resp, body) => {
          if (err) {
            rej(err)
          } else {
            const $ = cheerio.load(body)
            if (isSale) {
              let td = $('#sale-body')
              let _id = $(td).attr('data-url').match(/\?id=(\d*)&/)[1]
              res(_id)
            } else {
              let tbody = $('.sale-item-table tbody[data-url]')
              let _id = $(tbody).attr('data-url').match(/\?id=(\d*)&/)[1]
              res(_id)
            }
          }
        })
      })
    }

    function getSaleRequest(_id, isPurchase = false, isQuick) {
      return new Promise((gRes, gRej) => {
        let url = `https://www.c5game.com/api/product/sale.json?id=${_id}&quick=&gem_id=0&page=1&flag=&delivery=${isQuick ? 1 : 2}&sort=&b1=&style=`
        if (isPurchase) {
          url = `https://www.c5game.com/api/product/purchase.json?id=${_id}&page=1&_=${+new Date()}`
        }
        console.log(url)
        request(url, {
          headers: {
            Cookie: that.cookie
          },
          json: true
        }, (err, resp, body) => {
          if (err) {
            gRej(err)
          } else if (body.status !== 200) {
            gRej(body)
          } else {
            gRes(body.body.items)
          }
        })
      })
    }

    return new Promise((gRes, gRej) => {
      Promise.all([
        getApiId(true),
        getApiId(false)
      ])
        .then(([saleId, purchaseId]) => {
          Promise.all([
            getSaleRequest(saleId, false, true),
            getSaleRequest(saleId, false, false),
            getSaleRequest(purchaseId, true)
          ])
            .then(([quickResp, manualResp, purchaseResp]) => {
              let _res = {
                quick: null,
                manual: null,
                purchase: null
              }
              if (quickResp.length) {
                _res.quick = quickResp[0]
              }
              if (manualResp.length) {
                _res.manual = manualResp[0]
              }
              if (purchaseResp.length) {
                _res.purchase = purchaseResp[0]
              }
              gRes(_res)
            })
            .catch(err => {
              console.log('get price info err', err)
              gRej('get price info err')
            })
        })
    })
  }

  // 下单买饰品
  async buyGoods(id) {
    try {
      let params = await this._getOrderParams(id)
      console.log('获取参数成功')
      let orderId = await this._createOrder({
        id: params.id,
        paypwd: 816814,
        'is_nopass': 'off',
        price: params.price,
        method: params.method,
        coupon: '',
        coupon_amount: '',
        buy_secret: ''
      })
      console.log('下单成功')
      let info = await this._sendTradeOffer(orderId)
      console.log(info)
    } catch (e) {
      console.log(e)
      return Promise.reject(e)
    }
  }

  // 获取饰品下单参数
  _getOrderParams(id) {
    const url = `https://www.c5game.com/default/order/quick?id=${id}`
    return new Promise((gRes, gRej) => {
      request(
        url,
        {
          headers: {
            Cookie: this.cookie
          },
          json: true
        }, (err, resp, body) => {
          if (err) {
            gRej(err)
          } else if (body.status !== 200) {
            gRej(body)
          } else {
            console.log(body.body.methods)
            const {
              body: {
                id,
                item_name,
                methods,
                price,
                balance_enough
              }
            } = body
            let method = methods.some(_ => _.type === 1) ? 1 : 2
            gRes({
              id,
              name: item_name,
              price,
              isBalanceEnough: balance_enough,
              method
            })
          }
        })
    })
  }

  // 创建订单
  _createOrder(params) {
    const url = `https://www.c5game.com/api/order/payment.json`
    return new Promise((gRes, gRej) => {
      request.post(
        url,
        {
          formData: params,
          headers: {
            Cookie: this.cookie
          },
          json: true
        },
        (err, resp, body) => {
          if (err) {
            gRej(err)
          } else if (body.status !== 200) {
            gRej(body)
          } else {
            gRes(body.body['order_id'])
          }
        }
      )
    })
  }

  // 发起报价
  _sendTradeOffer(id) {
    const url = 'https://www.c5game.com/api/order/create-receive-offer'
    return new Promise((gRes, gRej) => {
      request.post(
        url,
        {
          formData: {
            id
          },
          headers: {
            Cookie: this.cookie
          },
          json: true
        },
        (err, resp, body) => {
          if (err) {
            gRej(err)
          } else if (body.status !== 200) {
            gRej(body)
          } else {
            gRes(body)
          }
        }
      )
    })
  }
}

module.exports = C5Robot