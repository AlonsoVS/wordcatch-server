import { createServer } from "http";
import express, { Express, Request, Response } from "express";
import socket from "./socket";
import { Socket } from "socket.io";
import { AttemptResponse, Word, JoinToRoomResponse, AttemptCount } from "./types";
import attemptChecker from "./utils/attemptChecker";
import { InMemoryStore, RoomStore } from "./store/roomStore";
import pointsCounter from "./utils/pointsCounter";

const port = process.env.PORT || 8080;
const app:Express = express();
const server = createServer(app);
const io = socket(server);
const gameRoomNamespace = io.of('/game-room');

app.get('/game-room', (request:Request, response:Response) => {
  response.sendFile(`${__dirname}/index.html`);
});

const serverStore:InMemoryStore = new InMemoryStore();

gameRoomNamespace.on('connection', (socket:Socket) => {
  console.log('User connected to server');
  gameRoomNamespace.to(socket.id).emit('connected', socket.id);

  let roomId = '';
  let roomStore:RoomStore|null = null;

  socket.on('create-room', (room:string) => {
    socket.join(room);
    roomId = room;
    roomStore = serverStore.createRoomStore(room);
    roomStore.savePlayer(socket.id);
    console.log(`Room with Id=${room} was created`);
  });

  socket.on('join-to-room', (room:string) => {
    socket.join(room);
    console.log(`User with Id=${socket.id} has joined to the room with Id=${room}`);
    roomId = room;
    roomStore = serverStore.getRoomStore(room);
    roomStore.savePlayer(socket.id);
    const roomUsersFound = gameRoomNamespace.adapter.rooms.get(room);
    const joinResponse:JoinToRoomResponse = { 
      user: socket.id, 
      usersInRoom: Array.from(roomUsersFound || []) 
    };
    gameRoomNamespace.to(room)
      .emit('user-joined', joinResponse);
  });

  socket.on('word-range-selected', (words:Array<Word>) => {
    roomStore?.saveSelectedWordRange(socket.id, words);
    socket.to(roomId).emit('word-range-selected', words);
  });

  socket.on('words-selected', (words:Array<Word>) => {
    const playersInRoom = Array.from(gameRoomNamespace.adapter.rooms.get(roomId) || []);
    const otherPlayer = playersInRoom.find(id => id !== socket.id) || '';
    console.log('Self => ', socket.id)
    console.log('Other player => ', otherPlayer);
    console.log('Roomstore => ', roomStore);
    roomStore?.saveSelectedWords(socket.id, words);
    const selectedWordRange = roomStore?.getSelectedWordRange(otherPlayer);
    if (selectedWordRange && selectedWordRange.length > 0) {
      socket.to(roomId)
      .emit('words-selected', words.map(sWord => { 
          const { word, ...restWord } = sWord; 
          return restWord;
        })
      );
    }
  }); 

  socket.on('send-attempt', (words:Array<Word>) => {
    const playersInRoom = Array.from(gameRoomNamespace.adapter.rooms.get(roomId) || []);
    const otherPlayer = playersInRoom.find(id => id !== socket.id) || '';
    const selectedWords = roomStore?.getSelectedWords(otherPlayer);
    if (selectedWords && selectedWords?.length > 0) {
      const attempts = words.map((word):AttemptCount => {
        const attempt = roomStore?.getAttempt(socket.id, word.id);
          if (attempt) return attempt;
          return {
            count: 0,
            successful: false,
            wordId: word.id
          }
      }); 
      const checkResult = attemptChecker(words, selectedWords, attempts);
      const { attemptPoints, pointsPerWord } = pointsCounter(checkResult, roomStore?.getMaxAttemptsToGuess() || 3);
      const playerPoints = roomStore?.updatePlayerPoints(
          socket.id, 
          roomStore.getPlayerPoints(socket.id) + attemptPoints
      );
      const attemptResult:AttemptResponse = {  
        attemptPoints,
        points: { 
          [otherPlayer]: roomStore?.getPlayerPoints(otherPlayer) || 0, 
          [socket.id]: playerPoints || 0
        },
        pointsPerWord
      };
      roomStore?.saveAttempt(socket.id, checkResult);
      gameRoomNamespace.to(roomId).emit('attempt-checked', attemptResult); 
    }
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