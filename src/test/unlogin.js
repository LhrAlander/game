const Robot = require('../robots/c5')
const SteamBot = require('../../../steamAPI/src/scripts/Steam')
const account = require('../../../steamAPI/src/config/accounts/alanderlt')

const log = console.log.bind(console)
const bot = new SteamBot(account.userName, account.password, account.sharedSecret, account.identitySecret)
bot.setSteamId(account.steamid)
bot.setMachineAuth(account.machineAuth)

const c5Bot = new Robot(bot)

c5Bot.getCash()
  .then(log)
  .catch(log)
