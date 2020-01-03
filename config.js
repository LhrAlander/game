module.exports = {
  c5: {
    indexURL: 'https://www.c5game.com/dota.html',
    heroPath: '.filter-cat-content .filter-hero a',
    heroGoodsURL: 'https://www.c5game.com/dota.html',
    heroGoodsPath: 'li.selling',
    heroGoodsPurchasePath: 'li.purchaseing',
    heroGoodsPagePath: 'ul.pagination li.last a'
  },
  buff: {
    indexURL: 'https://buff.163.com/market/?game=dota2#tab=selling&page_num=1',
    heroPath: '.hero-type li',
    heroGoodsURL: 'https://buff.163.com/api/market/goods',
    heroGoodsPurchaseURL: 'https://buff.163.com/api/market/goods/buying'
  }
}