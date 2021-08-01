import { createServer } from "http";
import express, { Express, Request, Response } from "express";
import socket from "./socket";
import { Socket } from "socket.io";

const port = process.env.PORT || 8080;
const app:Express = express();
const server = createServer(app);
const io = socket(server);
const gameRoomNamespace = io.of('/game-room');

app.get('/game-room', (request:Request, response:Response) => {
  response.sendFile(`${__dirname}/index.html`);
});

gameRoomNamespace.on('connection', (socket:Socket) => {
  console.log('User connected to server');

  gameRoomNamespace.to(socket.id).emit('connected', socket.id);

  socket.on('create-room', (room:string) => {
    socket.join(room);
    console.log(`Room with Id=${room} was created`);
  });

  socket.on('join-to-room', (room:string) => {
    socket.join(room);
    console.log(`User with Id=${socket.id} has joined to room with Id=${room}`);
    const roomFound = gameRoomNamespace.adapter.rooms.get(room);
    gameRoomNamespace.to(room).emit('user-joined', Array.from(roomFound || []));
  });

  socket.on('disconnect', () => {
    console.log(`User with Id=${socket.id} disconnected.`);
    socket.broadcast.emit('disconnected', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Running Wordcatch Server. \nListen on port ${port}`);
  console.log(`You can view the main page in http://localhost:${port}`);
});