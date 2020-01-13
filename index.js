const Robot = require('./src/robots/c5')
const SteamBot = require('../steamAPI/src/scripts/Steam')
const account = require('../steamAPI/src/config/accounts/alanderlt')

const bot = new SteamBot(account.userName, account.password, account.sharedSecret, account.identitySecret)
bot.setSteamId(account.steamid)
bot.setMachineAuth(account.machineAuth)

async function checkTrade() {
  try {
    let offers = await bot.getAllTradeOffers()
    console.log(offers)
    if (offers.length) {
      let res = await bot.acceptTradeOffer(offers[0].id, offers[0].pid)
      console.log(`确认报价成功: ${res}`)
    } else {
      console.log('暂无需要确认的报价')
    }
  } catch (e) {
    console.log(e)
  }
}

async function checkConfirm() {
  try {
    let confirms = await bot.fetchAllConfirms()
    if (confirms.length) {
      let res = await bot.acceptConfirm(confirms[0])
      console.log('确认成功')
    } else {
      console.log('暂无事项需要确认')
    }
  } catch (e) {
    console.log(e)
  }
}

bot
  .login()
  .then(() => {
    console.log(bot.cookieStr)
    setInterval(checkTrade, 5000)
    setInterval(checkConfirm, 3000)
  })
  .catch(err => {
    console.log(err)
  })

