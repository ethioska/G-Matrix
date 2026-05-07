// ================================
// server.js
// G-Matrix Live Voice Server
// ================================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

// =================================
// ROOM STORAGE
// =================================

const rooms = {};

// =================================
// ROOM IDS
// =================================

const ROOM_IDS = [];

for (let i = 100000; i <= 101500; i++) {
    ROOM_IDS.push(i.toString());
}

function generateRoomId(name) {

    const used = Object.keys(rooms);

    const free = ROOM_IDS.find(id => !used.includes(id));

    if (free) return free;

    return (
        name.charAt(0).toUpperCase() +
        Math.floor(100000 + Math.random() * 900000)
    );
}

// =================================
// SOCKETS
// =================================

io.on("connection", socket => {

    console.log("USER CONNECTED");

    // ============================
    // HOST ROOM
    // ============================

    socket.on("host-room", data => {

        const roomId = generateRoomId(data.name);

        rooms[roomId] = {
            roomId,
            hostName: data.name,
            hostSocket: socket.id,
            listeners: [],
            speakers: [],
            micRequests: []
        };

        socket.join(roomId);

        socket.emit("room-created", {
            roomId,
            hostName: data.name
        });

        console.log("ROOM CREATED:", roomId);

    });

    // ============================
    // JOIN ROOM
    // ============================

    socket.on("join-room", data => {

        const room = rooms[data.roomId];

        if (!room) {
            socket.emit("join-error", "Room not found");
            return;
        }

        if (
            room.hostName.toLowerCase().trim() !==
            data.hostName.toLowerCase().trim()
        ) {
            socket.emit("join-error", "Wrong Host Name");
            return;
        }

        socket.join(data.roomId);

        room.listeners.push({
            socketId: socket.id,
            name: data.name
        });

        io.to(room.hostSocket).emit("listener-update", {
            total: room.listeners.length
        });

        socket.emit("join-success", {
            roomId: data.roomId,
            hostName: room.hostName
        });

    });

    // ============================
    // APPLY MIC
    // ============================

    socket.on("apply-mic", data => {

        const room = rooms[data.roomId];

        if (!room) return;

        room.micRequests.push({
            socketId: socket.id,
            name: data.name
        });

        io.to(room.hostSocket).emit("mic-request", {
            socketId: socket.id,
            name: data.name
        });

    });

    // ============================
    // ACCEPT MIC
    // ============================

    socket.on("accept-mic", data => {

        const room = rooms[data.roomId];

        if (!room) return;

        room.speakers.push({
            socketId: data.userSocket,
            name: data.name
        });

        io.to(data.userSocket).emit("mic-approved");

        io.to(data.roomId).emit("speaker-update", {
            speakers: room.speakers
        });

    });

    // ============================
    // REJECT MIC
    // ============================

    socket.on("reject-mic", data => {

        io.to(data.userSocket).emit("mic-rejected");

    });

    // ============================
    // MUTE USER
    // ============================

    socket.on("mute-user", data => {

        io.to(data.userSocket).emit("force-muted");

    });

    // ============================
    // KICK USER
    // ============================

    socket.on("kick-user", data => {

        io.to(data.userSocket).emit("kicked");

    });

    // ============================
    // CHAT
    // ============================

    socket.on("send-message", data => {

        io.to(data.roomId).emit("new-message", {
            name: data.name,
            message: data.message
        });

    });

    // ============================
    // DISCONNECT
    // ============================

    socket.on("disconnect", () => {

        for (const roomId in rooms) {

            const room = rooms[roomId];

            // HOST LEFT
            if (room.hostSocket === socket.id) {

                io.to(roomId).emit("room-closed");

                delete rooms[roomId];

                console.log("ROOM CLOSED:", roomId);
            }

        }

    });

});

// =================================

server.listen(PORT, () => {
    console.log("SERVER RUNNING");
});
