## C5极速发货流程
1. ``https://www.c5game.com/default/order/quick?id={id}``
```js
{
  status: 200,
  message: "",
  error_no: 0,
  body: {
    id: "743901417",
    appid: "570",
    appname: "dota2",
    item_name: "堕落斗篷箭袋",
    id: "743901417",
    appid: "570",
    appname: "dota2",
    item_name: "堕落斗篷箭袋",
    item_img: "https://i.c5game.com/economy/570/2016/07/17/c417a979eb7dfd3e2009bfcb5389f7af.png",
    bot_type: "alone",
    is_self_sell: "0",
    methods: [
      {
        type: 1,
        text: "到Steam库存",
        tips: ""
      }
    ],
    balance: 119.56,
    price: 0.28,
    balance_enough: 1,
    is_no_pay_pwd: 0,
    coupon: [],
    show_insure: 0,
    insure_price: 0,
    insure_fee: 0,
    tips: "您购买的饰品为自动发货饰品，购买后无需等待卖家发货",
  }
}
````

2. ``https://www.c5game.com/api/order/payment.json post``
```js
request = {
  id: 743901417,
  paypwd: 816814,
  is_nopass: off,
  price: 0.28,
  method: 1,
  coupon: '',
  coupon_amount: '',
  buy_secret: ''
}

response = {
  status: 200,
  message: "",
  error_no: 0,
  body: {
    is_self_sell: "0",
    order_id: "686641355",
    tips: "请在20分钟内前完成收货，超时系统将自动取消该笔订单。您也可稍后在 个人中心-> 购买记录 中收货",
    action: "b2p_auto",
    receive_method: "1",
  }
}
````
3. ``https://www.c5game.com/api/order/create-receive-offer post``
```js
request = {
  id: 686641355
}
response = unknown
```

4. 