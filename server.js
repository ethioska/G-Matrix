const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.use(cors());
app.use(express.static('.'));

io.on('connection', socket => {

  socket.on('chat-message', data => {
    io.emit('chat-message', data);
  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('Server running on '+PORT);
});
