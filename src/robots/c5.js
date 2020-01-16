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
    this.loginDep = []
  }

  isLoginPage(htmlText) {
    const $ = cheerio.load(htmlText)
    let loginForm = $('#modal-user-login')
    return !!loginForm.length
  }

  login() {
    return new Promise(async (gRes, gRej) => {
      this.loginDep.push({
        res: gRes,
        rej: gRej
      })
      if (!this.isLogin) {
        this.isLogin = true
        login(this.steamBot)
          .then(cookie => {
            this.cookie = cookie
            this.loginDep.forEach(dep => dep.res())
            this.isLogin = false
          })
          .catch(e => {
            this.loginDep.forEach(dep => dep.rej(e))
            this.isLogin = false
          })
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
      console.log(url)
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
          } else if (resp.statusCode !== 200) {
            gRej(body)
          } else {
            if (body.status === 404) {
              gRes([])
            } else {
              gRes(body.body.items)
            }
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

  // 判断是否登录
  judgeIsLogin() {
    const url = 'https://www.c5game.com/api/login/isLogin'
    return new Promise((res, rej) => {
      request(url, {
        headers: {Cookie: this.cookie},
        json: true
      }, (err, resp, body) => {
        if (err) {
          rej(err)
        } else {
          if (body.status === 403 || body.status === 401) {
            res(false)
          } else {
            res(true)
          }
        }
      })
    })
  }

  // 下单买饰品
  async buyGoods(id) {
    try {
      let isLogin = await this.judgeIsLogin()
      if (!isLogin) {
        console.log('登录失效，重新登录')
        await this.login()
        return this.buyGoods(id)
      } else {
        let params = await this._getOrderParams(id)
        let {orderId, receive_method} = await this._createOrder({
          id: params.id,
          paypwd: 816814,
          'is_nopass': 'off',
          price: params.price,
          method: params.method,
          coupon: '',
          coupon_amount: '',
          buy_secret: ''
        })
        return {
          orderId,
          receiveMethod: receive_method
        }
      }
    } catch (e) {
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
            let method =
              methods.some(_ => _.type === 1)
                ? 1
                : 3
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
  sendTradeOffer(id) {
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

  // 查询人工发货列表
  checkManualList() {
    function parseHtml(htmlText) {
      const $ = cheerio.load(htmlText)
      const buttons = $('.j_Cancel')
      let _res = []
      if (buttons.length) {
        buttons.each((index, button) => {
          let id = $(button).attr('data-id')
          let canCancel = !$(button).attr('class').includes('disable')
          _res.push({
            id,
            canCancel
          })
        })
      }
      return _res
    }

    const url = `https://www.c5game.com/user/order/buyerHistory.html?page=1&appid=&sell_type=1&buy_type=&status=3`
    return new Promise((gRes, gRej) => {
      request(url, {
        headers: {
          Cookie: this.cookie
        }
      }, (err, resp, body) => {
        if (err) {
          gRej(err)
        } else if (resp.statusCode === 401 || resp.statusCode === 403) {
          this.login()
            .then(() => this.checkManualList())
            .then(gRes)
            .catch(gRej)
        } else {
          gRes(parseHtml(body))
        }
      })
    })
  }

  // 取消人工发货订单
  cancelManualOrder(id) {
    const url = `https://www.c5game.com/api/order/selfCancelOrder`
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
          } else if (resp.statusCode === 401 || resp.statusCode === 403) {
            this.login()
              .then(() => this.cancelManualOrder(id))
              .then(gRes)
              .catch(gRej)
          } else {
            gRes(body)
          }
        }
      )
    })
  }

  // 获取背包中的饰品
  getGoodsInBag() {
    function parseHtml(htmlText) {
      const $ = cheerio.load(htmlText)
      const items = $('.item.waitWithDraw')
      let _res = []
      items.each((index, item) => {
        const input = $(item).find('input[name="id[]"]')
        const name = $(item).find('.name-ellipsis a').text().trim()
        const id = input.attr('value')
        _res.push({
          name,
          id
        })
      })
      return _res
    }

    const url = `https://www.c5game.com/user/inventory/withdraw.html?appid=570`
    return new Promise((gRes, gRej) => {
      request(url, {
        headers: {
          Cookie: this.cookie
        }
      }, (err, resp, body) => {
        if (err) {
          gRej(err)
        } else if (resp.statusCode === 401 || resp.statusCode === 403) {
          this.login()
            .then(() => this.getGoodsInBag())
            .then(gRes)
            .catch(gRej)
        } else {
          gRes(parseHtml(body))
        }
      })
    })
  }

  // 取回背包中的饰品至steam
  withdrawGoods(id) {
    const url = `https://www.c5game.com/api/inventory/withdarw.json`
    const formData = {
      appid: 570,
      'id[]': id
    }
    return new Promise((gRes, gRej) => {
      request.post(
        url,
        {
          formData,
          headers: {
            Cookie: this.cookie
          },
          json: true
        },
        (err, resp, body) => {
          if (err) {
            gRej(err)
          } else if (resp.statusCode === 401 || resp.statusCode === 403) {
            this.login()
              .then(() => this.withdrawGoods(id))
              .then(gRes)
              .catch(gRej)
          } else {
            console.log(resp.statusCode)
            if (body.status === 200) {
              gRes({
                success: true
              })
            } else {
              gRes({
                success: false,
                data: body
              })
            }
          }
        }
      )
    })
  }

  // 判断c5机器人报价状态
  getC5Robots() {
    const that = this
    function _requestPromise(from) {
      const url = `https://www.c5game.com/api/offer/tracker.json?from=${from}`
      return new Promise((gRes, gRej) => {
        request(url, {
          headers: {
            Cookie: that.cookie
          },
          json: true
        }, (err, resp, body) => {
          if (err) {
            gRej(err)
          } else if (resp.statusCode === 401 || resp.statusCode === 403) {
            gRej({status: false, code: 401})
          } else {
            if (body.status === 404) {
              gRes([])
            } else {
              let _res = body
                .body
                .filter(trade => trade.operation.status === 1 && trade.operation.message.includes('交易报价发送成功'))
                .map(trade => {
                  return {
                    partenerInfo: {
                      name: trade.bot.name
                    },
                    id: trade.operation.operation.url.match(/tradeoffer\/(\d*)/)[1]
                  }
                })
              gRes(_res)
            }
          }
        })
      })
    }

    const url = `https://www.c5game.com/api/offer/tracker.json?from=inventory`
    let promises = []
    let froms = ['inventory', 'seller_history']
    froms.forEach(from => promises.push(_requestPromise(from)))
    return new Promise((gRes, gRej) => {
      Promise.all(promises)
        .then(itemsArray => {
          let _res = []
          itemsArray.forEach(items => {
            items.forEach(item => _res.push(item))
          })
          gRes(_res)
        })
        .catch((err) => {
          if (err.code === 401) {
            this.login()
              .then(() => this.getC5Robots())
              .then(gRes)
              .catch(gRej)
          }
        })
    })
  }

  // 出售饰品
  purchaseGoods(id) {

  }
}

module.exports = C5Robot
