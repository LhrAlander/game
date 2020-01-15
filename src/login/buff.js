const puppeteer = require('puppeteer')

async function login(bot) {
  let isInfoFilled = false
  return new Promise(async (gRes, gRej) => {
    try {
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
        if (isInfoFilled) {
          return
        }
        steamBrowser = await target.browser()
        const pages = await steamBrowser.pages()
        let page = pages.filter(_ => _.url().includes('steam'))[0]
        await page.waitFor('#steamAccountName')
        await page.type('#steamAccountName', bot.username, {delay: 50})
        await page.type('#steamPassword', bot.password, {delay: 50})
        await page.click('#imageLogin')
        await page.waitFor('#twofactorcode_entry', {visible: true})
        let code = await bot.get2faCode()
        await page.type('#twofactorcode_entry', code, {delay: 50})
        isInfoFilled = true
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
