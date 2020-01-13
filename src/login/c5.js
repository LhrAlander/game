const puppeteer = require('puppeteer')

function login(bot) {
  const url = `https://www.c5game.com/api/passport/steam.json?proxy_switch=1`
  return new Promise(async (gRes, gRej) => {
    try {
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
      await page.type('#steamAccountName', bot.username, {delay: 100})
      await page.type('#steamPassword', bot.password, {delay: 100})
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

module.exports = login