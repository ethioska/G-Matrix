const socket = io();

let currentUser = null;

async function signup() {

  const name = document.getElementById('name').value;

  const res = await fetch('/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name })
  });

  const data = await res.json();

  currentUser = data.user;

  localStorage.setItem('gmatrix-user', JSON.stringify(currentUser));

  document.getElementById('signupBox').style.display = 'none';
  document.getElementById('chat').style.display = 'block';

  document.getElementById('userInfo').innerText = `${currentUser.name} | ID: ${currentUser.id}`;

  socket.emit('join-user', currentUser);

  loadMessages();
}

async function loadMessages() {

  const res = await fetch('/messages');

  const messages = await res.json();

  messages.forEach(addMessage);
}

function sendMessage() {

  const input = document.getElementById('messageInput');

  if (!input.value) return;

  socket.emit('send-message', {
    user: currentUser,
    text: input.value
  });

  input.value = '';
}

socket.on('new-message', msg => {
  addMessage(msg);
});

function addMessage(msg) {

  const div = document.createElement('div');

  div.className = 'message';

  div.innerHTML = `
    <strong>${msg.user.name}</strong><br>
    ${msg.text}
  `;

  document.getElementById('messages').appendChild(div);
}

window.onload = () => {

  const saved = localStorage.getItem('gmatrix-user');

  if (saved) {

    currentUser = JSON.parse(saved);

    document.getElementById('signupBox').style.display = 'none';
    document.getElementById('chat').style.display = 'block';

    document.getElementById('userInfo').innerText = `${currentUser.name} | ID: ${currentUser.id}`;

    socket.emit('join-user', currentUser);

    loadMessages();
  }
}
