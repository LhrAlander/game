const request = require('request')
const login = require('../login/buff')
const cheerio = require('cheerio')

class BuffRobot {
  constructor(steamBot) {
    if (!steamBot) {
      return console.log('必须配置steam机器人')
    }
    this.steamBot = steamBot
    this.islogin = false
    this.loginDep = []
    this.cookie = `Device-Id=edMtezr8OApolvSVVlRt; _ga=GA1.2.1632031904.1579058041; nts_mail_user=13588737694@163.com:-1:1; _ntes_nnid=07a595c72149dc9bd9d580799dd869f4,1579137438178; _ntes_nuid=07a595c72149dc9bd9d580799dd869f4; ANTICSRF=e0fda87447291d4d8926f9da20449826; Locale-Supported=zh-Hans; _gid=GA1.2.604346052.1579226380; NTES_YD_SESS=B09yL40w9Vh8.2ozWnj67oqiPGr1Ty1HYGEU7cCT7oxbRYNr78A0QWxiVOwU6BY0koSKnDnQKjsOyzatQGiPiEDPtjZkPq_Jnghlxerz1FTiZQXmFA.bFmVx3CT5Q0DOHHsBBPCC5jTTLftjAw3S8V8DdzWIgexUF1xVc6dNf6K14HpcWKpc2tRqQpRnPMF8rXzZ9o8I7Sd9brqHmY6lWMohKQoF6F8azwr7tdOGiz4NJ; S_INFO=1579226397|0|3&80##|13588737694; P_INFO=13588737694|1579226397|1|netease_buff|00&99|zhj&1579058038&netease_buff#zhj&330100#10#0#0|&0|null|13588737694; session=1-oI4gN6kuB-UxSSlhBNb2BsECpLF-hVzMpiv2perk6dbM2046469057; game=dota2; csrf_token=IjMyOTI4ZDBkNjkzMzcyOWZhNzdlNDhjZTljMTAwOTk4NjM4M2FhNjYi.EQLoIQ.SL5UBQCVNVsCqq5DVTTAr9D0zbQ`
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

  buyGoods(item) {
    function checkCanBuy() {
      const buffAliPay = 3
      const buffBankPay = 1
      const buffUnionPay = 8
      const allowPayMethods = [buffAliPay, buffBankPay, buffUnionPay]
      const url = `https://buff.163.com/api/market/goods/buy/preview?game=dota2&sell_order_id=${item.id}&goods_id=${item['goods_id']}&price=${item.price}&allow_tradable_cooldown=0&cdkey_id=&_=${+new Date()}`
      return new Promise((gRes, gRej) => {
        request(url, {
          headers: {Cookie: this.cookie},
          json: true
        }, (err, resp, body) => {
          if (err) {
            gRej(err)
          } else {
            if (body.code === 'Login Required') {
              this.login()
                .then(() => this.buyGoods(item))
                .then(gRes)
                .catch(gRej)
            } else {
              let payMethods = body.data['pay_methods']
              let payMethod = -1
              for (let i = 0, l = payMethods.length; i < l; i++) {
                if (allowPayMethods.includes(payMethods[i].value) && payMethods[i].enough) {
                  payMethod = payMethods[i]
                  break
                }
              }
              if (payMethod === -1) {
                gRes({
                  success: false,
                  code: 'NO_PAY_ALLOWED_METHOD'
                })
              } else {
                gRes({
                  success: true,
                  data: payMethod
                })
              }
            }
          }
        })
      })
    }

    return new Promise((gRes, gRej) => {
      checkCanBuy()
        .then(res => {
          if (res.success) {
            let payMethod = res.data
            const url = `https://buff.163.com/api/market/goods/buy`
            const formData = {
              game: 'dota2',
              'goods_id': item['goods_id'],
              'sell_order_id': item.id,
              price: payMethod['price_with_pay_fee'],
              'pay_method': payMethod.value,
              'allow_tradable_cooldown': 0,
              token: '',
              'cdkey_id': ''
            }
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
                } else {
                  if (body.code === 'OK') {
                    gRes({
                      success: true,
                      data: body.data
                    })
                  } else if (body.code === 'Login Required') {
                    this.login()
                      .then(() => this.buyGoods(item))
                      .then(gRes)
                      .catch(gRej)
                  } else {
                    gRes({
                      success: false,
                      data: body
                    })
                  }
                }
              }
            )
          } else {
            gRej(res)
          }
        })
    })
  }

  checkManualList() {
    function parseHtml(htmlText) {
      const $ = cheerio.load(htmlText)
      const orders = $('a[class*=cancel-deliver]')
      let _res = []
      orders.each((index, order) => {
        const id = $(order).attr('data-orderid')
        const url = $(order).attr('href')
        const cancelCd = +$(order).attr('data-buyer-cancel-timeout')
        if (cancelCd < 0) {
          _res.push({
            id
          })
        }
      })
      return _res
    }

    const url = `https://buff.163.com/market/buy_order/history?game=dota2`
    return new Promise((gRes, gRej) => {
      request(url, {headers: {Cookie: this.cookie}}, (err, resp, body) => {
        if (err) {
          gRej(err)
        } else {
          if (body.code === 'Login Required') {
            this.login()
              .then(() => this.checkManualList())
              .then(gRes)
              .catch(gRej)
          } else {
            gRes(parseHtml(body))
          }
        }
      })
    })
  }

  cancelManualOrder(id) {
    const url = `https://buff.163.com/api/market/bill_order/deliver/cancel`
    const formData = {
      game: 'dota2',
      bill_order_id: id
    }
    return new Promise((gRes, gRej) => {
      request.post(url, {
        json: true,
        headers: {
          Cookie: this.cookie
        },
        formData
      }, (err, resp, body) => {
        if (err) {
          gRej(err)
        } else if (resp.statusCode === 403 || resp.statusCode === 401) {
          this.login()
            .then(() => this.cancelManualOrder(id))
            .then(gRes)
            .catch(gRej)
        } else {
          if (body.code === 'OK') {
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
      })
    })
  }

  // 获取背包饰品数据
  getGoodsInBag() {
    const that = this

    function getByPage(pageNum) {
      const url = `https://buff.163.com/api/market/backpack?game=dota2&page_num=${pageNum}&_=${+new Date()}`
      return new Promise((gRes, gRej) => {
        request(url, {json: true, headers: {Cookie: that.cookie}}, (err, resp, body) => {
          if (err) {
            gRej(err)
          } else {
            if (body.code === 'OK') {
              gRes({
                success: true,
                data: {
                  items: body.data.items,
                  info: body.data['goods_infos'],
                  totalPage: body.data['total_page']
                }
              })
            } else if (body.code === 'Login Required') {
              that.login()
                .then(() => getByPage(pageNum))
                .then(gRes)
                .catch(gRej)
            }
          }
        })
      })
    }

    const res = []

    function parseGoodsInBag({data: {items, info}}) {
      items.forEach(item => {
        if (item.state !== 3) {
          res.push({
            id: item.id,
            name: info[item['goods_id']]['market_hash_name']
          })
        }
      })
    }

    const promises = []
    return new Promise((gRes, gRej) => {
      getByPage(1)
        .then(data => {
          parseGoodsInBag(data)
          if (data.totalPage > 1) {
            for (let i = 2; i <= data.totalPage; i++) {
              promises.push(getByPage(i))
            }
            Promise.all(promises)
              .then(dataArray => {
                dataArray.forEach(parseGoodsInBag)
                gRes(res)
              })
              .catch(gRej)
          } else {
            gRes(res)
          }
        })
        .catch(gRej)
    })
  }

  // 饰品取回
  withdraw() {
    return new Promise((gRes, gRej) => {
      this.getGoodsInBag()
        .then(items => {
          if (items.length) {
            const formData = {
              backpack_ids: items.map(_ => _.id),
              game: 'dota2'
            }
            console.log(formData)
            const url = `https://buff.163.com/api/market/backpack/withdraw`
            request.post(
              url,
              {
                body: formData,
                headers: {
                  Cookie: this.cookie
                },
                json: true
              },
              (err, resp, body) => {
                if (err) {
                  gRej(err)
                } else {
                  if (body.code === 'OK') {
                    gRes()
                  } else if (body.code === 'Login Required') {
                    this.login()
                      .then(() => this.withdraw())
                      .then(gRes)
                      .catch(gRej)
                  } else {
                    gRej(body)
                  }
                }
              }
            )
          }
        })
        .catch(gRej)
    })
  }

  // 获取buff机器人状态
  getRobots() {
    const url = `https://buff.163.com/api/market/steam_trade?_=${+new Date()}`
    return new Promise((gRes, gRej) => {
      request(url, {headers: {Cookie: this.cookie}, json: true}, (err, resp, body) => {
        if (err) {
          gRej(err)
        } else {
          if (body.code === 'OK') {
            let res = []
            body.data.forEach(offer => {
              if (offer.state === 1 && offer.tradeofferid) {
                res.push({
                  id: offer.tradeofferid,
                  partenerInfo: {
                    name: offer['bot_name']
                  }
                })
              }
            })
            gRes(res)
          } else if (body.code === 'Login Required') {
            this.login()
              .then(() => this.getRobots())
              .then(gRes)
              .catch(gRej)
          } else {
            gRej(body)
          }
        }
      })
    })
  }

  // 获取待发货列表
  getDeliverItems() {
    const url = `https://buff.163.com/market/sell_order/to_deliver?game=dota2`
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
            .then(() => this.getDeliverItems())
            .then(gRes)
            .catch(gRej)
        } else {
          let ids = body.match(/sellingToDeliver\((\[.*\]),.*\)/)[1]
          gRes(JSON.parse(ids))
        }
      })
    })
  }

  // buff发货
  deliver() {
    const url = 'https://buff.163.com/api/market/bill_order/deliver'
    return new Promise((gRes, gRej) => {
      this.getDeliverItems()
        .then(items => {
          const body = {
            game: 'dota2',
            bill_orders: items
          }
          request.post(
            url,
            {
              headers: {
                Cookie: this.cookie
              },
              json: true,
              body
            },
            (err, resp, body) => {
              if (err) {
                gRej(err)
              } else if (body.code === 'Login Required'){
                this.login()
                  .then(() => this.deliver())
                  .then(gRes)
                  .catch(gRej)
              } else {
                gRes()
              }
            }
          )
        })
    })
  }

}

module.exports = BuffRobot