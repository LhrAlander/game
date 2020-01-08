const puppeteer = require('puppeteer')
const SteamBot = require('../../../steamAPI/src/scripts/Steam')
const account = require('../../../steamAPI/src/config/accounts/alanderlt')

async function login() {
  return new Promise(async (gRes, gRej) => {
    try {
      let bot = new SteamBot(account.userName, account.password, account.sharedSecret, account.identitySecret)
      const url = 'https://buff.163.com/account/login'
      const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
          width: 1920,
          height: 1080
        }
      })

      const buffPage = await browser.newPage()
      await buffPage.goto(url)
      let steamBrowser = null
      browser.on('targetcreated', async function (target) {
        steamBrowser = await target.browser()
        const pages = await steamBrowser.pages()
        let page = pages.filter(_ => _.url().includes('steam'))[0]
        await page.waitFor('#steamAccountName')
        await page.type('#steamAccountName', account.userName, {delay: 100})
        await page.type('#steamPassword', account.password, {delay: 100})
        await page.click('#imageLogin')
        await page.waitFor('#twofactorcode_entry', {visible: true})
        let code = await bot.get2faCode()
        await page.type('#twofactorcode_entry', code, {delay: 100})
        page.click('#login_twofactorauth_buttonsets #login_twofactorauth_buttonset_entercode .auth_button.leftbtn')
        await buffPage.waitFor('.login-user')
        let cookies = await buffPage.cookies()
        let _ = cookies.map(({name, value}) => `${name}=${value}`).join('; ')
        await browser.close()
        gRes(_)
      })
      await buffPage.click('#j_login_other')
    } catch (err) {
      gRej(err)
    }
  })
}

module.exports = login
