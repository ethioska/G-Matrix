async function loadNews() {
  try {
    const res = await fetch("news.json");
    const news = await res.json();
    const newsList = document.getElementById("newsList");
    newsList.innerHTML = "";

    news.forEach(item => {
      const div = document.createElement("div");
      div.className = "news-item";

      let text = item.text ? `<p>${item.text}</p>` : "";
      let date = `<small>${item.date || ""}</small>`;
      let img = item.image ? `<img src="${item.image}" alt="news image">` : "";

      div.innerHTML = `${text}${img}${date}`;
      newsList.appendChild(div);
    });
  } catch (e) {
    console.error("Failed to load news", e);
  }
}

// 🔹 Navigation
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.getElementById(pageId).style.display = "block";

  document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
  document.getElementById("btn-" + pageId).classList.add("active");

  if (pageId === "home") {
    loadNews();
  }
}

// Default load Home
showPage("home");
