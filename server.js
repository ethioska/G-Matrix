const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const rooms = {};

function generateRoomId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getSafeRoom(roomId) {
    return rooms[roomId] || null;
}

io.on('connection', socket => {

    socket.on('host-room', data => {

        const roomId = generateRoomId();

        rooms[roomId] = {
            roomId,
            hostSocket: socket.id,
            hostName: data.hostName,
            listeners: [],
            speakers: [],
            requests: [],
            chat: []
        };

        socket.join(roomId);

        socket.roomId = roomId;
        socket.userName = data.hostName;
        socket.role = 'host';

        socket.emit('room-created', rooms[roomId]);

        io.to(roomId).emit('room-update', rooms[roomId]);

    });

    socket.on('join-room', data => {

        const room = getSafeRoom(data.roomId);

        if (!room) {
            socket.emit('room-error', 'Room not found');
            return;
        }

        if (room.hostName.toLowerCase() !== data.hostName.toLowerCase()) {
            socket.emit('room-error', 'Host name incorrect');
            return;
        }

        socket.join(data.roomId);

        socket.roomId = data.roomId;
        socket.userName = data.userName;
        socket.role = 'listener';

        room.listeners.push({
            id: socket.id,
            name: data.userName,
            muted: false
        });

        io.to(data.roomId).emit('room-update', room);

        socket.emit('joined-success', room);

    });

    socket.on('request-mic', () => {

        const room = getSafeRoom(socket.roomId);

        if (!room) return;

        const already = room.requests.find(x => x.id === socket.id);

        if (already) return;

        room.requests.push({
            id: socket.id,
            name: socket.userName
        });

        io.to(room.hostSocket).emit('mic-request', {
            id: socket.id,
            name: socket.userName
        });

        io.to(socket.roomId).emit('room-update', room);

    });

    socket.on('approve-user', userId => {

        const room = getSafeRoom(socket.roomId);

        if (!room) return;

        const requestUser = room.requests.find(x => x.id === userId);

        if (!requestUser) return;

        room.requests = room.requests.filter(x => x.id !== userId);

        room.speakers.push({
            id: requestUser.id,
            name: requestUser.name,
            muted: false
        });

        io.to(userId).emit('approved-speaker');

        io.to(socket.roomId).emit('room-update', room);

    });

    socket.on('reject-user', userId => {

        const room = getSafeRoom(socket.roomId);

        if (!room) return;

        room.requests = room.requests.filter(x => x.id !== userId);

        io.to(userId).emit('request-rejected');

        io.to(socket.roomId).emit('room-update', room);

    });

    socket.on('mute-user', userId => {

        const room = getSafeRoom(socket.roomId);

        if (!room) return;

        room.speakers = room.speakers.map(user => {
            if (user.id === userId) {
                user.muted = true;
            }
            return user;
        });

        io.to(userId).emit('muted-by-host');

        io.to(socket.roomId).emit('room-update', room);

    });

    socket.on('unmute-user', userId => {

        const room = getSafeRoom(socket.roomId);

        if (!room) return;

        room.speakers = room.speakers.map(user => {
            if (user.id === userId) {
                user.muted = false;
            }
            return user;
        });

        io.to(userId).emit('unmuted-by-host');

        io.to(socket.roomId).emit('room-update', room);

    });

    socket.on('kick-user', userId => {

        const room = getSafeRoom(socket.roomId);

        if (!room) return;

        room.listeners = room.listeners.filter(x => x.id !== userId);
        room.speakers = room.speakers.filter(x => x.id !== userId);

        io.to(userId).emit('kicked');

        io.to(socket.roomId).emit('room-update', room);

    });

    socket.on('chat-message', data => {

        const room = getSafeRoom(socket.roomId);

        if (!room) return;

        const message = {
            name: socket.userName,
            text: data.text,
            time: Date.now()
        };

        room.chat.push(message);

        io.to(socket.roomId).emit('new-chat', message);

    });

    socket.on('disconnect', () => {

        const room = getSafeRoom(socket.roomId);

        if (!room) return;

        if (room.hostSocket === socket.id) {

            io.to(socket.roomId).emit('host-ended');

            delete rooms[socket.roomId];

            return;
        }

        room.listeners = room.listeners.filter(x => x.id !== socket.id);
        room.speakers = room.speakers.filter(x => x.id !== socket.id);
        room.requests = room.requests.filter(x => x.id !== socket.id);

        io.to(socket.roomId).emit('room-update', room);

    });

});

server.listen(PORT, () => {
    console.log('G-Matrix Running');
});
