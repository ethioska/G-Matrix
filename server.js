const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const rooms = {};

function generateRoomId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

io.on("connection", (socket) => {

    socket.on("host-room", ({ name }) => {

        const roomId = generateRoomId();

        rooms[roomId] = {
            roomId,
            host: socket.id,
            hostName: name,
            listeners: [],
            speakers: []
        };

        socket.join(roomId);

        io.to(socket.id).emit("room-created", {
            roomId,
            hostName: name
        });

    });

    socket.on("join-room", ({ roomId, name, hostName }) => {

        const room = rooms[roomId];

        if (!room) {
            io.to(socket.id).emit("join-error", "Room Not Found");
            return;
        }

        if (
            room.hostName.toLowerCase().trim() !==
            hostName.toLowerCase().trim()
        ) {
            io.to(socket.id).emit("join-error", "Wrong Host Name");
            return;
        }

        socket.join(roomId);

        room.listeners.push({
            socketId: socket.id,
            name
        });

        io.to(room.host).emit("listener-joined", {
            socketId: socket.id,
            name
        });

        io.to(roomId).emit("listeners-update", {
            count: room.listeners.length
        });

        io.to(socket.id).emit("join-success", {
            roomId,
            hostName: room.hostName
        });

    });

    socket.on("apply-mic", ({ roomId, name }) => {

        const room = rooms[roomId];

        if (!room) return;

        io.to(room.host).emit("mic-request", {
            socketId: socket.id,
            name
        });

    });

    socket.on("approve-speaker", ({ roomId, user }) => {

        const room = rooms[roomId];

        if (!room) return;

        room.speakers.push(user);

        io.to(user.socketId).emit("mic-approved");

        io.to(roomId).emit("speaker-approved", room.speakers);

    });

    socket.on("mute-user", ({ target }) => {
        io.to(target).emit("force-muted");
    });

    socket.on("kick-user", ({ target }) => {
        io.to(target).emit("kicked");
    });

    socket.on("speaking", ({ roomId, socketId, speaking }) => {

        io.to(roomId).emit("speaking-update", {
            socketId,
            speaking
        });

    });

    socket.on("chat-message", ({ roomId, name, message }) => {

        io.to(roomId).emit("chat-message", {
            name,
            message
        });

    });

    socket.on("disconnect", () => {

        for (const roomId in rooms) {

            const room = rooms[roomId];

            if (room.host === socket.id) {

                io.to(roomId).emit("room-ended");

                delete rooms[roomId];
            }

        }

    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server Running " + PORT);
});
