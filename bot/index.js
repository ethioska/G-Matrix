const { Telegraf } = require("telegraf");
const fs = require("fs");
const path = require("path");
const { BOT_TOKEN, ADMIN_ID, NEWS_FILE } = require("./config");

const bot = new Telegraf(BOT_TOKEN);

// Path for news.json
const newsPath = path.join(__dirname, NEWS_FILE);
if (!fs.existsSync(newsPath)) {
  fs.writeFileSync(newsPath, JSON.stringify([]));
}

// /start
bot.start(ctx => {
  ctx.reply("👋 Welcome! Use /news <message> to post updates.");
});

// /news command (text only)
bot.command("news", ctx => {
  if (ctx.from.id !== ADMIN_ID) {
    return ctx.reply("❌ You are not allowed to post news.");
  }

  const text = ctx.message.text.replace("/news", "").trim();
  if (!text) {
    return ctx.reply("Usage: /news <message>");
  }

  let news = JSON.parse(fs.readFileSync(newsPath));
  news.unshift({
    text,
    date: new Date().toISOString().slice(0, 16).replace("T", " ")
  });

  fs.writeFileSync(newsPath, JSON.stringify(news, null, 2));
  ctx.reply("✅ News added!");
});

// When you send a photo with a caption
bot.on("photo", ctx => {
  if (ctx.from.id !== ADMIN_ID) return;

  const fileId = ctx.message.photo.pop().file_id;
  const caption = ctx.message.caption || "";

  // Telegram File URL (⚠️ temporary, may expire after a while)
  const imageUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileId}`;

  let news = JSON.parse(fs.readFileSync(newsPath));
  news.unshift({
    text: caption,
    image: imageUrl,
    date: new Date().toISOString().slice(0, 16).replace("T", " ")
  });

  fs.writeFileSync(newsPath, JSON.stringify(news, null, 2));
  ctx.reply("✅ News with image added!");
});

bot.launch();
console.log("🚀 Bot is running...");
