const { flushGoods } = require('../pre/flushGoods')
const count = 1
function startTask() {
  console.log(`第${count}轮爬取`)
  flushGoods()
    .then(startTask)
    .catch(err => console.log(err))
}

startTask()
