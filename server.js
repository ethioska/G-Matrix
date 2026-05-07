const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// =========================
// STORAGE PATHS
// =========================

const STORAGE = {
  users: path.join(__dirname, 'storage/users'),
  messages: path.join(__dirname, 'storage/messages'),
  voice: path.join(__dirname, 'storage/voice'),
  photos: path.join(__dirname, 'storage/photos'),
  rooms: path.join(__dirname, 'storage/rooms')
};

Object.values(STORAGE).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// =========================
// FILE HELPERS
// =========================

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath));
}

function generateUserId() {
  return Math.floor(100000 + Math.random() * 900000);
}

// =========================
// USER SIGNUP
// =========================

app.post('/signup', (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name required'
      });
    }

    const userId = generateUserId();

    const user = {
      id: userId,
      name,
      bio: '',
      coins: 0,
      followers: 0,
      following: 0,
      createdAt: Date.now(),
      avatarColor: '#' + Math.floor(Math.random()*16777215).toString(16)
    };

    const filePath = path.join(STORAGE.users, `${userId}.json`);

    writeJSON(filePath, user);

    res.json({
      success: true,
      user
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false
    });
  }
});

// =========================
// GET USER
// =========================

app.get('/user/:id', (req, res) => {
  const filePath = path.join(STORAGE.users, `${req.params.id}.json`);

  const user = readJSON(filePath);

  if (!user) {
    return res.status(404).json({
      success: false
    });
  }

  res.json(user);
});

// =========================
// UPDATE USER
// =========================

app.post('/user/update', (req, res) => {
  const user = req.body;

  const filePath = path.join(STORAGE.users, `${user.id}.json`);

  writeJSON(filePath, user);

  res.json({
    success: true
  });
});

// =========================
// IMAGE UPLOAD
// =========================

const upload = multer({
  dest: 'uploads/'
});

app.post('/upload-photo', upload.single('photo'), (req, res) => {
  res.json({
    success: true,
    path: `/uploads/${req.file.filename}`
  });
});

// =========================
// GLOBAL CHAT STORAGE
// =========================

const GLOBAL_CHAT = path.join(STORAGE.messages, 'global.json');

if (!fs.existsSync(GLOBAL_CHAT)) {
  writeJSON(GLOBAL_CHAT, []);
}

app.get('/messages', (req, res) => {
  const messages = readJSON(GLOBAL_CHAT) || [];

  res.json(messages);
});

// =========================
// SOCKET.IO REALTIME
// =========================

let onlineUsers = {};

io.on('connection', socket => {

  console.log('User connected:', socket.id);

  socket.on('join-user', user => {
    onlineUsers[socket.id] = user;

    io.emit('online-users', Object.values(onlineUsers));
  });

  socket.on('send-message', data => {

    const messages = readJSON(GLOBAL_CHAT) || [];

    const msg = {
      id: uuidv4(),
      user: data.user,
      text: data.text,
      time: Date.now()
    };

    messages.push(msg);

    writeJSON(GLOBAL_CHAT, messages);

    io.emit('new-message', msg);
  });

  socket.on('voice-note', data => {

    const fileName = `voice_${Date.now()}.webm`;

    const base64Data = data.audio.replace(/^data:audio\/webm;base64,/, '');

    const filePath = path.join(STORAGE.voice, fileName);

    fs.writeFileSync(filePath, base64Data, 'base64');

    io.emit('new-voice-note', {
      user: data.user,
      audio: `/voice/${fileName}`
    });
  });

  socket.on('disconnect', () => {
    delete onlineUsers[socket.id];

    io.emit('online-users', Object.values(onlineUsers));

    console.log('User disconnected');
  });
});

// =========================
// VOICE FILE ACCESS
// =========================

app.use('/voice', express.static(path.join(__dirname, 'storage/voice')));

// =========================
// START SERVER
// =========================

server.listen(PORT, () => {
  console.log(`G-Matrix server running on ${PORT}`);
});
