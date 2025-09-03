const { Telegraf } = require("telegraf");
const fs = require("fs");
const path = require("path");

// CONFIG
const BOT_TOKEN = "YOUR_BOT_TOKEN";   // replace with your bot token
const ADMIN_ID = 6905441721;          // replace with your Telegram ID
const bot = new Telegraf(BOT_TOKEN);

// PATH to news.json
const NEWS_FILE = path.join(__dirname, "../webapp/news.json");

// Load news
function loadNews() {
  try {
    return JSON.parse(fs.readFileSync(NEWS_FILE));
  } catch {
    return [];
  }
}

// Save news
function saveNews(data) {
  fs.writeFileSync(NEWS_FILE, JSON.stringify(data, null, 2));
}

// Default auto-delete days
let autoDeleteDays = 7;

// --- Commands --- //

// Post text news
bot.command("news", ctx => {
  if (ctx.from.id !== ADMIN_ID) return;
  const text = ctx.message.text.replace("/news", "").trim();
  if (!text) return ctx.reply("❌ Usage: /news Your text here");

  let news = loadNews();
  news.unshift({
    text,
    date: new Date().toLocaleString()
  });
  saveNews(news);

  ctx.reply("✅ News posted!");
});

// Handle photo + caption
bot.on("photo", async ctx => {
  if (ctx.from.id !== ADMIN_ID) return;

  const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
  const caption = ctx.message.caption || "";

  const file = await ctx.telegram.getFile(fileId);
  const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;

  let news = loadNews();
  news.unshift({
    text: caption,
    image: fileUrl,
    date: new Date().toLocaleString()
  });
  saveNews(news);

  ctx.reply("✅ News with image posted!");
});

// List all news
bot.command("list", ctx => {
  if (ctx.from.id !== ADMIN_ID) return;
  let news = loadNews();
  if (news.length === 0) return ctx.reply("📭 No news available.");

  let msg = news.map((n, i) => `${i + 1}. ${n.text || "🖼️ [Image only]"}`).join("\n");
  ctx.reply(msg);
});

// Delete by index
bot.command("del", ctx => {
  if (ctx.from.id !== ADMIN_ID) return;
  let parts = ctx.message.text.split(" ");
  let idx = parseInt(parts[1]) - 1;
  if (isNaN(idx)) return ctx.reply("❌ Usage: /del <number>");

  let news = loadNews();
  if (idx < 0 || idx >= news.length) return ctx.reply("❌ Invalid index.");

  news.splice(idx, 1);
  saveNews(news);
  ctx.reply("🗑️ News deleted!");
});

// Clear all with confirmation
let pendingClear = {};
bot.command("clearall", ctx => {
  if (ctx.from.id !== ADMIN_ID) return;
  pendingClear[ctx.from.id] = true;
  ctx.reply("⚠️ Are you sure you want to delete ALL news? Reply YES to confirm.");
});

bot.on("text", ctx => {
  if (ctx.from.id !== ADMIN_ID) return;
  if (pendingClear[ctx.from.id]) {
    if (ctx.message.text.trim().toUpperCase() === "YES") {
      saveNews([]);
      ctx.reply("🧹 All news cleared!");
    } else {
      ctx.reply("❌ Cancelled. News NOT deleted.");
    }
    delete pendingClear[ctx.from.id];
  }
});

// Set auto-delete days
bot.command("setdays", ctx => {
  if (ctx.from.id !== ADMIN_ID) return;
  let num = parseInt(ctx.message.text.split(" ")[1]);
  if (isNaN(num)) return ctx.reply("❌ Usage: /setdays <number>");
  autoDeleteDays = num;
  ctx.reply(`✅ Auto-delete set to ${num} days.`);
});

// Get auto-delete days
bot.command("getdays", ctx => {
  if (ctx.from.id !== ADMIN_ID) return;
  ctx.reply(`📅 Auto-delete is set to ${autoDeleteDays} days.`);
});

// Auto-delete old news every hour
setInterval(() => {
  let news = loadNews();
  let cutoff = Date.now() - autoDeleteDays * 24 * 60 * 60 * 1000;
  let filtered = news.filter(n => {
    if (!n.date) return true;
    return new Date(n.date).getTime() > cutoff;
  });
  if (filtered.length !== news.length) {
    saveNews(filtered);
  }
}, 60 * 60 * 1000);

// Start bot
bot.launch();
console.log("✅ Bot is running...");
