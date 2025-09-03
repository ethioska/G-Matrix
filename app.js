function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.getElementById(pageId).style.display = "block";

  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
  document.getElementById("btn-" + pageId).classList.add("active");
}

// Load news
async function loadNews() {
  try {
    let res = await fetch("news.json?" + new Date().getTime());
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

loadNews();
setInterval(loadNews, 15000);

// Show Home by default
showPage("home");
