const { Server } = require("socket.io");
const express = require("express");
const cors = require("cors");
const http = require("http");
const env = require("dotenv");

env.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: true,
});

app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World");
});

// Helper function to generate random 5-character room IDs
const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 7); // Generates random string of 5 chars
};

const rooms = new Set(); // Store created room IDs
const emailToSocket = new Map();
const socketToEmail = new Map();

io.on("connection", (socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  // Handle room creation
  socket.on("room:Create", (data) => {
    const { email } = data;
    const room = generateRoomId(); // Create a random room ID
    rooms.add(room); // Add the room ID to the list of rooms

    emailToSocket.set(email, socket.id);
    socketToEmail.set(socket.id, email);

    socket.join(room);
    io.to(room).emit("user:joined", { email, id: socket.id });

    // Notify the client that the room was created and joined
    io.to(socket.id).emit("room:join", { email, room });
  });

  // Handle joining a room with validation
  socket.on("room:join", (data) => {
    const { email, room } = data;

    // Check if room exists
    if (rooms.has(room)) {
      emailToSocket.set(email, socket.id);
      socketToEmail.set(socket.id, email);

      socket.join(room);
      io.to(room).emit("user:joined", { email, id: socket.id });

      // Notify the client that they successfully joined the room
      io.to(socket.id).emit("room:join", { email, room });
    } else {
      // If the room does not exist, send an error message to the user
      io.to(socket.id).emit("room:join:error", {
        error: "Room does not exist",
      });
    }
  });

  // Handle user call events
  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incoming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  socket.on("call:end", ({ to, room }) => {
    io.to(to).emit("call:end", { from: socket.id });
    const roomId = room?.room
    // Remove the user from maps
    const email = socketToEmail.get(socket.id);
    emailToSocket.delete(email);
    socketToEmail.delete(socket.id);

    // Leave the room
    socket.leave(roomId);

    // Check if the room is now empty
    const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
    console.log("room size" ,roomSize)
    if (roomSize === 0) {
      rooms.delete(roomId);
      console.log(
        `Room ${room} deleted.`,
        "socketToEmail",
        socketToEmail,
        "emailToSocket",
        emailToSocket
      );
    }
  });

  socket.on("call:initiated", ({ to }) => {
    io.to(to).emit("call:initiated", { from: socket.id });
  });
});

server.listen(process.env.PORT, "0.0.0.0", () =>
  console.log(`Server has started.`)
);
