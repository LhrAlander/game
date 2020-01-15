const Robot = require('../robots/buff')
const SteamBot = require('../../../steamAPI/src/scripts/Steam')
const account = require('../../../steamAPI/src/config/accounts/alanderlt')

const bot = new SteamBot(account)

const log = console.log.bind(console)
const buffRobot = new Robot(bot)

buffRobot.getPriceInfo(27586)
  .then(log)
  .catch(log)
