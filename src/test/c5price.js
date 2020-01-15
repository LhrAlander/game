const Robot = require('../robots/c5')
const SteamBot = require('../../../steamAPI/src/scripts/Steam')
const account = require('../../../steamAPI/src/config/accounts/alanderlt')

const bot = new SteamBot(account)

const log = console.log.bind(console)
const c5Robot = new Robot(bot)

c5Robot.getPriceInfo(553481224)
  .then(log)
  .catch(log)

// c5Robot.buyGoods(771239239)
