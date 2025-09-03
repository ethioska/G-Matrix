function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.getElementById(pageId).style.display = "block";
}

// Example news fetching (from JSON that bot updates)
async function loadNews() {
  try {
    let res = await fetch("news.json"); // bot updates this file
    let news = await res.json();
    let container = document.getElementById("newsList");
    container.innerHTML = "";
    news.forEach(item => {
      let div = document.createElement("div");
      div.className = "news-item";
      div.textContent = item;
      container.appendChild(div);
    });
  } catch (e) {
    console.log("No news yet.");
  }
}

loadNews();
