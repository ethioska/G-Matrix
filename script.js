let coins = 500;

function goToRoom(name, host) {
    document.getElementById('home-page').classList.remove('active');
    document.getElementById('voice-room').classList.add('active');
    document.getElementById('active-room-name').innerText = name;
}

function goHome() {
    document.getElementById('voice-room').classList.remove('active');
    document.getElementById('home-page').classList.add('active');
}

function toggleTask() {
    document.getElementById('task-sidebar').classList.toggle('open');
}

function checkEnter(e) {
    if (e.key === 'Enter') {
        let input = document.getElementById('chat-input');
        let chat = document.getElementById('room-chat');
        let p = document.createElement('p');
        p.innerHTML = `<b>You:</b> ${input.value}`;
        chat.appendChild(p);
        input.value = "";
        chat.scrollTop = chat.scrollHeight;
    }
}

function claim(amount) {
    coins += amount;
    document.getElementById('balance').innerText = coins;
    alert("Br " + amount + " Claimed!");
}

// Room Bombing Timer (Simulation)
setInterval(() => {
    console.log("Room Bombing gift checking...");
}, 10800000); // 3 Hours
