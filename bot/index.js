const { Telegraf } = require("telegraf");
const fs = require("fs");
const path = require("path");
const { BOT_TOKEN, ADMIN_ID, NEWS_FILE } = require("./config");

const bot = new Telegraf(BOT_TOKEN);

// === SETTINGS ===
let settingsFile = path.join(__dirname, "settings.json");
let settings = { autoDeleteDays: 3 }; // default

// Load or create settings.json
if (fs.existsSync(settingsFile)) {
  settings = JSON.parse(fs.readFileSync(settingsFile));
} else {
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
}

// Path for news.json
const newsPath = path.join(__dirname, NEWS_FILE);
if (!fs.existsSync(newsPath)) {
  fs.writeFileSync(newsPath, JSON.stringify([]));
}

// Load + save helpers
function loadNews() {
  return JSON.parse(fs.readFileSync(newsPath));
}
function saveNews(news) {
  fs.writeFileSync(newsPath, JSON.stringify(news, null, 2));
}
function saveSettings() {
  fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
}

// Auto-clean old news
function cleanOldNews() {
  let news = loadNews();
  let now = Date.now();
  let cutoff = settings.autoDeleteDays * 24 * 60 * 60 * 1000; // days → ms

  let filtered = news.filter(n => {
    let created = new Date(n.timestamp).getTime();
    return now - created < cutoff;
  });

  if (filtered.length !== news.length) {
    saveNews(filtered);
    console.log("🧹 Old news auto-deleted");
  }
}

// Run cleanup at start
cleanOldNews();

// Pending confirmation for /clearall
let pendingClear = {};

// === COMMANDS ===

// /start
bot.start(ctx => {
  ctx.reply(`👋 Welcome! Commands:
/news <text> → post news
/list → list news
/del <index> → delete one
/clearall → delete all news (with confirmation)
/setdays <num> → set auto-delete days
/getdays → check current auto-delete setting

🧹 Current auto-delete: ${settings.autoDeleteDays} days`);
});

// /news command (text only)
bot.command("news", ctx => {
  if (ctx.from.id !== ADMIN_ID) return ctx.reply("❌ Not allowed.");

  const text = ctx.message.text.replace("/news", "").trim();
  if (!text) return ctx.reply("Usage: /news <message>");

  let news = loadNews();
  news.unshift({
    text,
    date: new Date().toISOString().slice(0,16).replace("T"," "),
    timestamp: Date.now()
  });

  saveNews(news);
  ctx.reply("✅ News added!");
});

// Photo with caption
bot.on("photo", ctx => {
  if (ctx.from.id !== ADMIN_ID) return;

  const fileId = ctx.message.photo.pop().file_id;
  const caption = ctx.message.caption || "";
  const imageUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileId}`;

  let news = loadNews();
  news.unshift({
    text: caption,
    image: imageUrl,
    date: new Date().toISOString().slice(0,16).replace("T"," "),
    timestamp: Date.now()
  });

  saveNews(news);
  ctx.reply("✅ News with image added!");
});

// /list command
bot.command("list", ctx => {
  if (ctx.from.id !== ADMIN_ID) return;
  let news = loadNews();

  if (news.length === 0) return ctx.reply("📰 No news yet.");
  
  let msg = "📝 Current news list:\n";
  news.forEach((n, i) => {
    msg += `${i+1}. ${n.text.substring(0,40)} (${n.date})\n`;
  });
  ctx.reply(msg);
});

// /del command
bot.command("del", ctx => {
  if (ctx.from.id !== ADMIN_ID) return;
  let args = ctx.message.text.split(" ");
  if (args.length < 2) return ctx.reply("Usage: /del <index>");

  let index = parseInt(args[1]) - 1;
  let news = loadNews();

  if (index < 0 || index >= news.length) return ctx.reply("❌ Invalid index.");

  let removed = news.splice(index, 1);
  saveNews(news);

  ctx.reply(`🗑 Deleted: ${removed[0].text}`);
});

// /clearall command (confirmation)
bot.command("clearall", ctx => {
  if (ctx.from.id !== ADMIN_ID) return;

  pendingClear[ctx.from.id] = true;
  ctx.reply("⚠️ Are you sure you want to delete ALL news? Reply YES to confirm.");
});

// Confirmation reply handler
bot.on("text", ctx => {
  if (ctx.from.id !== ADMIN_ID) return;

  const text = ctx.message.text.trim().toUpperCase();

  if (pendingClear[ctx.from.id] && text === "YES") {
    saveNews([]);
    ctx.reply("🧹 All news cleared!");
    delete pendingClear[ctx.from.id];
  } else if (pendingClear[ctx.from.id]) {
    ctx.reply("❌ Cancelled. All news NOT deleted.");
    delete pendingClear[ctx.from.id];
  }
});

// /setdays command
bot.command("setdays", ctx => {
  if (ctx.from.id !== ADMIN_ID) return;
  let args = ctx.message.text.split(" ");
  if (args.length < 2) return ctx.reply("Usage: /setdays <number>");

  let days = parseInt(args[1]);
  if (isNaN(days) || days <= 0) return ctx.reply("❌ Please enter a valid number of days.");

  settings.autoDeleteDays = days;
  saveSettings();
  ctx.reply(`✅ Auto-delete set to ${days} days.`);
});

// /getdays command
bot.command("getdays", ctx => {
  if (ctx.from.id !== ADMIN_ID) return;
  ctx.reply(`🧹 Current auto-delete is set to ${settings.autoDeleteDays} days.`);
});

bot.launch();
console.log("🚀 Bot running...");
