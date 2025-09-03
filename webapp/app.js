// Switch pages
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.getElementById(pageId).style.display = "block";
}

// Load news from news.json
async function loadNews() {
  try {
    let res = await fetch("news.json?" + new Date().getTime()); // prevent caching
    let news = await res.json();
    let container = document.getElementById("newsList");
    container.innerHTML = "";

    news.forEach(item => {
      let div = document.createElement("div");
      div.className = "news-item";

      let text = `<p>${item.text}</p>`;
      let date = `<small>${item.date || ""}</small>`;
      let img = item.image ? `<img src="${item.image}" alt="news image">` : "";

      div.innerHTML = `${text}${img}${date}`;
      container.appendChild(div);
    });
  } catch (e) {
    console.log("No news yet.");
  }
}

// Initial load
loadNews();

// Auto-refresh every 15 seconds
setInterval(loadNews, 15000);
