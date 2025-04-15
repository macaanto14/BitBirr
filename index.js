
const express = require('express');
const mongoose = require('mongoose');
const { Telegraf } = require('telegraf');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/usdt_orders', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

const Order = mongoose.model('Order', new mongoose.Schema({
  telegramId: String,
  orderType: String,
  amount: Number,
  usdtAddress: String,
  phone: String,
  createdAt: { type: Date, default: Date.now }
}));

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.telegram.setWebhook(`${process.env.WEBHOOK_URL}/bot${process.env.BOT_TOKEN}`);
app.use(bot.webhookCallback(`/bot${process.env.BOT_TOKEN}`));

bot.start(ctx => {
  ctx.reply('Welcome to USDT Exchange Bot!\n\nUse:\nBUY <amount> <USDT_address> <optional phone>\nSELL <amount> <USDT_address> <optional phone>');
});

bot.on('text', async ctx => {
  const parts = ctx.message.text.trim().split(/\s+/);
  if (parts.length < 3) {
    return ctx.reply('Format: BUY/SELL <amount> <USDT address> <optional phone>');
  }

  const orderType = parts[0].toUpperCase();
  const amount = parseFloat(parts[1]);
  const usdtAddress = parts[2];
  const phone = parts[3] || '';

  if (!['BUY', 'SELL'].includes(orderType) || isNaN(amount)) {
    return ctx.reply('Invalid input. Please follow: BUY/SELL <amount> <USDT address> <optional phone>');
  }

  await Order.create({
    telegramId: ctx.chat.id,
    orderType,
    amount,
    usdtAddress,
    phone
  });

  ctx.reply(`✅ ${orderType} order for ${amount} USDT received. We'll contact you shortly.`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
