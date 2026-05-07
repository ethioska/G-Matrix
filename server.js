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

app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

let rooms = {};

io.on("connection", (socket) => {

    socket.on("host-room", ({ roomId, hostName }) => {

        rooms[roomId] = {
            hostId: socket.id,
            hostName,
            listeners: [],
            speakers: []
        };

        socket.join(roomId);

        io.to(roomId).emit("room-data", rooms[roomId]);
    });

    socket.on("join-room", ({ roomId, name }) => {

        if (!rooms[roomId]) {
            socket.emit("room-not-found");
            return;
        }

        socket.join(roomId);

        rooms[roomId].listeners.push({
            id: socket.id,
            name
        });

        io.to(roomId).emit("room-data", rooms[roomId]);

        io.to(rooms[roomId].hostId).emit("mic-request", {
            userId: socket.id,
            name
        });
    });

    socket.on("approve-speaker", ({ roomId, userId, name }) => {

        if (!rooms[roomId]) return;

        rooms[roomId].speakers.push({
            id: userId,
            name
        });

        io.to(userId).emit("speaker-approved");

        io.to(roomId).emit("room-data", rooms[roomId]);
    });

    socket.on("send-message", ({ roomId, name, message }) => {

        io.to(roomId).emit("new-message", {
            name,
            message
        });

    });

    socket.on("disconnect", () => {

        for (let roomId in rooms) {

            if (rooms[roomId].hostId === socket.id) {

                io.to(roomId).emit("host-left");

                delete rooms[roomId];

            }

        }

    });

});

server.listen(PORT, () => {
    console.log("Server Running");
});
