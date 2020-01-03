const {getAllGoodsByHero} = require('../pre/buff')
getAllGoodsByHero('axe')
  .then(res => {
    console.log(res)
  })
  .catch(err => {
    console.error(err)
  })