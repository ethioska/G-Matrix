const { Telegraf } = require("telegraf");
const fs = require("fs");
const path = require("path");
const { BOT_TOKEN, ADMIN_ID, NEWS_FILE } = require("./config");

const bot = new Telegraf(BOT_TOKEN);

// Ensure news.json exists
const newsPath = path.join(__dirname, NEWS_FILE);
if (!fs.existsSync(newsPath)) {
  fs.writeFileSync(newsPath, JSON.stringify([]));
}

// /start
bot.start(ctx => {
  ctx.reply("Welcome! Use /news <your text> to post updates.");
});

// /news command
bot.command("news", ctx => {
  if (ctx.from.id !== ADMIN_ID) {
    return ctx.reply("You are not allowed to post news.");
  }

  const text = ctx.message.text.replace("/news", "").trim();
  if (!text) {
    return ctx.reply("Please provide news text. Example: /news Exams released today!");
  }

  // Load existing news
  let news = JSON.parse(fs.readFileSync(newsPath));

  // Add new news at top
  news.unshift(text);

  // Save back
  fs.writeFileSync(newsPath, JSON.stringify(news, null, 2));

  ctx.reply("✅ News added!");
});

bot.launch();
console.log("Bot is running...");
