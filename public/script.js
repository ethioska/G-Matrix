function showDeposit() {
    document.getElementById('depositModal').style.display = "block";
}

function closeModal() {
    document.getElementById('depositModal').style.display = "none";
}

function playGame(game) {
    alert(game + " ጨዋታን ለመጀመር Demo ፔጁ በመጫን ላይ ነው...");
    // ወደ SmartSoft Demo መውሰጃ ሊንክ
    window.location.href = "https://smartsoftgaming.com/games/" + game;
}

window.onclick = function(event) {
    let modal = document.getElementById('depositModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
