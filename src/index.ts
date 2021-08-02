import { createServer } from "http";
import express, { Express, Request, Response } from "express";
import socket from "./socket";
import { Socket } from "socket.io";
import { AttemptResponse, Word, AttemptsCount, JoinToRoomEventResponse } from "./types";

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

  let roomId = '';

  socket.on('create-room', (room:string) => {
    socket.join(room);
    roomId = room;
    console.log(`Room with Id=${room} was created`);
  });

  socket.on('join-to-room', (room:string) => {
    socket.join(room);
    roomId = room;
    console.log(`User with Id=${socket.id} has joined to room with Id=${room}`);
    const roomFound = gameRoomNamespace.adapter.rooms.get(room);
    const joinResponse:JoinToRoomEventResponse = { 
      user: socket.id, 
      usersInRoom: Array.from(roomFound || []) 
    };
    gameRoomNamespace.to(room)
      .emit('user-joined', joinResponse);
  });

  socket.on('word-range-selected', (words:Array<Word>) => {
    console.log(`Turn played - selected word range => ${JSON.stringify(words)}`);
    socket.to(roomId).emit('word-range-selected', words);
  });

  socket.on('words-selected', (words:Array<Word>) => {
    console.log(`Turn played - selected words => ${JSON.stringify(words)}`);
    socket.to(roomId).emit('words-selected', words);
  });

  socket.on('send-attempt', (words:Array<Word>) => {
    console.log(`Turn played - attempt sended => ${JSON.stringify(words)}`);
    console.log(`RoomID = ${roomId}`);
    const result:AttemptResponse = {  
      wordsAttempts: words.map((word):AttemptsCount => ({
        count: 1,
        successful: true,
        wordId: word.id
      })), 
      points: { player_1: 1, player_2: 2 }
    };
    gameRoomNamespace.to(roomId)
      .emit('attempt-checked', result);
  });

  socket.on('disconnect', () => {
    console.log(`User with Id=${socket.id} disconnected.`);
    gameRoomNamespace.to(roomId).emit('user-disconnected', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Running Wordcatch Server. \nListen on port ${port}`);
  console.log(`You can view the main page in http://localhost:${port}`);
});