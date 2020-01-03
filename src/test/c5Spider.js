const {getAllGoodsByHero} = require('../pre/c5')
getAllGoodsByHero('axe')
  .then(res => {
    console.log(res)
  })
  .catch(err => {
    console.error(err)
  })