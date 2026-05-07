const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin:"*"
    }
});

app.use(express.static("public"));

const rooms = {};

io.on("connection",(socket)=>{

    socket.on("host-room",(data)=>{

        rooms[data.roomId] = {
            host: socket.id,
            users:{}
        };

        rooms[data.roomId].users[socket.id] = {
            name:data.name,
            uid:data.uid,
            mic:true,
            muted:false,
            host:true
        };

        socket.join(data.roomId);

    });

    socket.on("join-room",(data)=>{

        if(!rooms[data.roomId]) return;

        rooms[data.roomId].users[socket.id] = {
            name:data.name,
            uid:data.uid,
            mic:false,
            muted:true,
            host:false
        };

        socket.join(data.roomId);

        io.to(data.roomId).emit(
            "room-users",
            Object.values(rooms[data.roomId].users)
        );

    });

    socket.on("apply-mic",(data)=>{

        const room = rooms[data.roomId];

        if(!room) return;

        io.to(room.host).emit("mic-request",{
            socketId:socket.id,
            name:data.name
        });

    });

    socket.on("accept-mic",(data)=>{

        const room = rooms[data.roomId];

        if(!room) return;

        room.users[data.userSocket].mic = true;
        room.users[data.userSocket].muted = false;

        io.to(data.userSocket).emit("mic-approved");

        io.to(data.roomId).emit(
            "room-users",
            Object.values(room.users)
        );

    });

    socket.on("mute-user",(data)=>{

        const room = rooms[data.roomId];

        if(!room) return;

        room.users[data.userSocket].muted = true;

        io.to(data.userSocket).emit("force-muted");

        io.to(data.roomId).emit(
            "room-users",
            Object.values(room.users)
        );

    });

    socket.on("unmute-user",(data)=>{

        const room = rooms[data.roomId];

        if(!room) return;

        room.users[data.userSocket].muted = false;

        io.to(data.userSocket).emit("host-unmuted");

        io.to(data.roomId).emit(
            "room-users",
            Object.values(room.users)
        );

    });

    socket.on("disconnect",()=>{

        for(const roomId in rooms){

            const room = rooms[roomId];

            if(room.host === socket.id){

                io.to(roomId).emit("room-ended");

                delete rooms[roomId];

            }else{

                delete room.users[socket.id];

                io.to(roomId).emit(
                    "room-users",
                    Object.values(room.users)
                );

            }

        }

    });

});

server.listen(3000,()=>{
    console.log("Server Running");
});
