let coins = 500;
let isMicOn = false;

function sendMessage() {
    let input = document.getElementById('chat-input');
    let chatBox = document.getElementById('chat-messages');
    
    if (input.value.trim() !== "") {
        let p = document.createElement('p');
        p.style.marginBottom = "8px";
        p.innerHTML = `<span style="color:#007bff; font-weight:bold;">እኔ:</span> ${input.value}`;
        chatBox.appendChild(p);
        
        input.value = "";
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Enter ሲጫን እንዲልክ
function handleKeyPress(e) {
    if (e.key === 'Enter') sendMessage();
}

function toggleMic() {
    isMicOn = !isMicOn;
    let btn = document.getElementById('mic-btn');
    btn.innerHTML = isMicOn ? '<i class="fas fa-microphone" style="color:#ff0055;"></i>' : '<i class="fas fa-microphone-slash"></i>';
}

function toggleGiftModal() {
    let modal = document.getElementById('giftModal');
    modal.style.display = (modal.style.display === "block") ? "none" : "block";
}

function sendGift(emoji, cost) {
    if (coins >= cost) {
        coins -= cost;
        document.getElementById('coin-count').innerText = coins;
        
        let chatBox = document.getElementById('chat-messages');
        let p = document.createElement('p');
        p.style.background = "rgba(255, 215, 0, 0.1)";
        p.style.padding = "5px";
        p.style.borderRadius = "5px";
        p.innerHTML = `🌟 <span style="color:gold;">እኔ ${emoji} ለHost ላክኩ!</span>`;
        chatBox.appendChild(p);
        
        toggleGiftModal();
        chatBox.scrollTop = chatBox.scrollHeight;
    } else {
        alert("በቂ ኮይን የሎትም!");
    }
}

function joinSeat(num) {
    alert("Seat " + num + " ላይ ለመቀመጥ እየሞከሩ ነው...");
}
