const {getAllGoodsByHero: buffGetGoods} = require('../pre/buff')
const {getAllGoodsByHero: c5GetGoods} = require('../pre/c5')
const {getAllHeros} = require('../pre/flushGoods')

async function patchGoodsNameByHero(hero) {
  try {
    console.log('爬取' + hero.name)
    const [buffGoods, c5Goods] = await Promise.all([
      buffGetGoods(hero.buffname),
      c5GetGoods(hero.c5name)
    ])
    const c5Only = []
    const common = []
    const buffOnly = []
    Object
      .keys(c5Goods)
      .forEach(key => {
        if (!buffGoods[key]) {
          c5Only.push(c5Goods[key])
          delete c5Goods[key]
        } else {
          common.push(c5Goods[key])
          delete buffGoods[key]
        }
      })
    Object
      .keys(buffGoods)
      .forEach(key => {
        buffOnly.push(buffGoods[key])
      })
    return {
      c5Only,
      common,
      buffOnly
    }
  } catch (err) {
    console.error(err)
  }
}

async function patchGoodsName() {
  try {
    const heros = await getAllHeros()
    let totalCommon = 0
    let totalC5Only = 0
    let totalBuffOnly = 0
    let totalAll = 0

    for (let i = 0, l = heros.length; i < l; i++) {
      let {c5Only, common, buffOnly} = await patchGoodsNameByHero(heros[i])
      let totalLength = c5Only.length + common.length + buffOnly.length
      console.log(`${heros[i].name}：c5独占：${c5Only.length}个名字；buff独占：${buffOnly.length}个名字；公共名字：${common.length}个；总计${totalLength}`)
      totalCommon += common.length
      totalC5Only += c5Only.length
      totalBuffOnly += buffOnly.length
      totalAll += totalLength
    }

    console.log('爬取完毕')
    console.table({
      totalBuffOnly,
      totalC5Only,
      totalCommon,
      totalAll
    })
  } catch (err) {
    console.error(err)
  }
}

module.exports = {
  patchGoodsName
}