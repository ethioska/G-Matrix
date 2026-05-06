function showDeposit() {
    document.getElementById('depositModal').style.display = "block";
}

function closeModal() {
    document.getElementById('depositModal').style.display = "none";
}

function playGame(game) {
    const gameSection = document.getElementById('game-display-section');
    const gamesList = document.getElementById('main-games-list');
    const iframeWrapper = document.getElementById('iframe-wrapper');

    // የጨዋታውን ሊንክ ማዘጋጀት
    let gameUrl = "";
    if(game === 'jetx') {
        gameUrl = "https://smartsoftgaming.com/games/jetx";
    } else if(game === 'balloon') {
        gameUrl = "https://smartsoftgaming.com/games/balloon";
    }

    // ገጹን ማስተካከል
    iframeWrapper.innerHTML = `<iframe src="${gameUrl}" width="100%" height="600px" frameborder="0" allowfullscreen></iframe>`;
    gameSection.style.display = "block";
    gamesList.style.display = "none"; // የጌሞቹን ዝርዝር ለጊዜው መደበቅ
    
    // ወደ ጨዋታው ዝቅ እንዲል ያደርጋል
    gameSection.scrollIntoView({ behavior: 'smooth' });
}

function closeGame() {
    document.getElementById('game-display-section').style.display = "none";
    document.getElementById('main-games-list').style.display = "grid";
    document.getElementById('iframe-wrapper').innerHTML = ""; // Iframe ን ማጽዳት
}
