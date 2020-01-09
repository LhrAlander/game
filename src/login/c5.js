const puppeteer = require('puppeteer')
const SteamBot = require('../../../steamAPI/src/scripts/Steam')
const account = require('../../../steamAPI/src/config/accounts/alanderlt')

function login() {
  const url = `https://www.c5game.com/api/passport/steam.json?proxy_switch=1`
  return new Promise(async (gRes, gRej) => {
    try {
      let bot = new SteamBot(account.userName, account.password, account.sharedSecret, account.identitySecret)
      const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
          width: 1920,
          height: 1080
        }
      })
      const page = await browser.newPage()
      await page.goto(url)
      await page.waitFor('#steamAccountName')
      await page.type('#steamAccountName', account.userName, {delay: 100})
      await page.type('#steamPassword', account.password, {delay: 100})
      await page.click('#imageLogin')
      await page.waitFor('#twofactorcode_entry', {visible: true})
      let code = await bot.get2faCode()
      await page.type('#twofactorcode_entry', code, {delay: 100})
      page.click('#login_twofactorauth_buttonsets #login_twofactorauth_buttonset_entercode .auth_button.leftbtn')
      await page.waitFor('a[href*=logout]')
      let cookies = await page.cookies()
      let _ = cookies.map(({name, value}) => `${name}=${value}`).join('; ').replace('C5Lang=zh', 'C5Lang=en')
      await browser.close()
      gRes(_)
    } catch (e) {
      gRej(e)
    }
  })
}

login()
  .then(console.log.bind(console))

module.exports = login