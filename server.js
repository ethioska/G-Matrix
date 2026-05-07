const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// =========================
// STORAGE
// =========================

const STORAGE = {
    users: path.join(__dirname, "storage/users"),
    rooms: path.join(__dirname, "storage/rooms"),
    messages: path.join(__dirname, "storage/messages"),
    voice: path.join(__dirname, "storage/voice"),
    photos: path.join(__dirname, "storage/photos")
};

// Create folders automatically
Object.values(STORAGE).forEach(folder => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
});

// =========================
// EXPRESS
// =========================

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// serve index.html directly
app.use(express.static(__dirname));

// uploads
app.use("/storage", express.static(path.join(__dirname, "storage")));

// MAIN ROUTE
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// =========================
// HELPERS
// =========================

function generateRoomId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function saveJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function readJSON(file) {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file));
}

// =========================
// MEMORY STORAGE
// =========================

let rooms = {};
let users = {};

// =========================
// SOCKET.IO
// =========================

io.on("connection", socket => {

    console.log("USER CONNECTED:", socket.id);

    // =========================
    // HOST ROOM
    // =========================

    socket.on("host-room", data => {

        const roomId = generateRoomId();

        rooms[roomId] = {
            host: socket.id,
            hostName: data.name,
            users: [],
            mics: {},
            createdAt: Date.now()
        };

        users[socket.id] = {
            roomId,
            name: data.name,
            role: "host"
        };

        socket.join(roomId);

        // save room
        saveJSON(
            path.join(STORAGE.rooms, `${roomId}.json`),
            rooms[roomId]
        );

        socket.emit("room-created", {
            roomId,
            host: true
        });

        console.log("ROOM CREATED:", roomId);
    });

    // =========================
    // JOIN ROOM
    // =========================

    socket.on("join-room", data => {

        const room = rooms[data.roomId];

        if (!room) {
            socket.emit("error-message", "Room not found");
            return;
        }

        socket.join(data.roomId);

        users[socket.id] = {
            roomId: data.roomId,
            name: data.name,
            role: "listener"
        };

        room.users.push({
            socketId: socket.id,
            name: data.name,
            mic: false,
            muted: false
        });

        io.to(data.roomId).emit("room-users", room.users);

        socket.emit("joined-room", {
            roomId: data.roomId,
            host: false
        });

        console.log(data.name, "joined", data.roomId);
    });

    // =========================
    // APPLY MIC
    // =========================

    socket.on("apply-mic", () => {

        const user = users[socket.id];
        if (!user) return;

        const room = rooms[user.roomId];
        if (!room) return;

        const target = room.users.find(u => u.socketId === socket.id);

        if (target) {
            target.mic = true;
        }

        io.to(user.roomId).emit("room-users", room.users);
    });

    // =========================
    // TOGGLE MIC
    // =========================

    socket.on("toggle-mic", state => {

        const user = users[socket.id];
        if (!user) return;

        io.to(user.roomId).emit("mic-status", {
            socketId: socket.id,
            enabled: state
        });
    });

    // =========================
    // HOST MUTE USER
    // =========================

    socket.on("host-mute-user", targetId => {

        const host = users[socket.id];
        if (!host) return;

        const room = rooms[host.roomId];
        if (!room) return;

        if (room.host !== socket.id) return;

        const target = room.users.find(u => u.socketId === targetId);

        if (target) {
            target.muted = true;
        }

        io.to(targetId).emit("force-muted");

        io.to(host.roomId).emit("room-users", room.users);
    });

    // =========================
    // HOST UNMUTE USER
    // =========================

    socket.on("host-unmute-user", targetId => {

        const host = users[socket.id];
        if (!host) return;

        const room = rooms[host.roomId];
        if (!room) return;

        if (room.host !== socket.id) return;

        const target = room.users.find(u => u.socketId === targetId);

        if (target) {
            target.muted = false;
        }

        io.to(targetId).emit("allow-unmute");

        io.to(host.roomId).emit("room-users", room.users);
    });

    // =========================
    // CHAT
    // =========================

    socket.on("send-message", data => {

        const user = users[socket.id];
        if (!user) return;

        const message = {
            id: Date.now(),
            sender: user.name,
            text: data.text,
            time: new Date().toLocaleTimeString()
        };

        const file = path.join(
            STORAGE.messages,
            `${user.roomId}.json`
        );

        let old = [];

        if (fs.existsSync(file)) {
            old = readJSON(file) || [];
        }

        old.push(message);

        saveJSON(file, old);

        io.to(user.roomId).emit("new-message", message);
    });

    // =========================
    // VOICE VISUALIZER
    // =========================

    socket.on("speaking", speaking => {

        const user = users[socket.id];
        if (!user) return;

        io.to(user.roomId).emit("user-speaking", {
            socketId: socket.id,
            speaking
        });
    });

    // =========================
    // DISCONNECT
    // =========================

    socket.on("disconnect", () => {

        const user = users[socket.id];

        if (!user) return;

        const room = rooms[user.roomId];

        // HOST LEFT
        if (room && room.host === socket.id) {

            io.to(user.roomId).emit("room-closed");

            delete rooms[user.roomId];

            const roomFile = path.join(
                STORAGE.rooms,
                `${user.roomId}.json`
            );

            if (fs.existsSync(roomFile)) {
                fs.unlinkSync(roomFile);
            }

            console.log("ROOM CLOSED:", user.roomId);
        }

        // NORMAL USER LEFT
        if (room) {
            room.users = room.users.filter(
                u => u.socketId !== socket.id
            );

            io.to(user.roomId).emit(
                "room-users",
                room.users
            );
        }

        delete users[socket.id];

        console.log("USER DISCONNECTED");
    });

});

// =========================
// START SERVER
// =========================

server.listen(PORT, () => {
    console.log(`
====================================
G-MATRIX SERVER RUNNING
PORT: ${PORT}
====================================
`);
});
