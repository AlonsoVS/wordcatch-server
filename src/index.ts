import { createServer } from "http";
import express, { Express, Request, Response } from "express";
import socket from "./socket";
import { Socket } from "socket.io";
import { AttemptResponse, Word, JoinToRoomResponse, AttemptCount, CustomSocket } from "./types";
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

gameRoomNamespace.use((socket:Socket, next:Function) => {
  const currentPlayer:CustomSocket = <CustomSocket> socket;
  const playerID:string|undefined = currentPlayer.handshake.auth.playerID;
  if (!playerID) {
    return next(new Error ('Connection error: not playerID provided'))
  }
  next();
});

gameRoomNamespace.on('connection', (socket:Socket) => {
  
  let roomId = '';
  let roomStore:RoomStore|null = null;
  
  const playerID:string = socket.handshake.auth.playerID;
  const playerAddress:string = socket.id;
  const room:string|undefined = socket.handshake.auth.roomID;
  console.log(`Player with ID=${playerID} connected to server`);
  
  if (room) {
    console.log(`Try to reconnect player with ID=${playerID} to room with ID=${room}`);
    const tempRoomStore = serverStore.getRoomStore(room);
    const sessionFound = tempRoomStore?.getPlayers().find(id => id === playerID);
    if (sessionFound) {
      roomId = room;
      roomStore = tempRoomStore;
      socket.join(room);
      console.log(`Player with ID=${playerID} reconnected to room with ID=${room}`);
      gameRoomNamespace.to(room).emit('user-reconnect', { 
        user: playerID, 
        usersInRoom: roomStore.getPlayers()
      });
    } else {
      console.log(`Failed to reconnect player with ID=${playerID} to room with ID=${room}. Session not found`);
      gameRoomNamespace.to(playerAddress).emit('session-not-found', room);
    }
  } else {
    gameRoomNamespace.to(playerAddress).emit('connected', playerID);
  }

  const usersInRoom = Array.from(gameRoomNamespace.adapter.rooms.get(roomId) || []);
  console.log(`Current Users in room => `, usersInRoom);

  socket.on('create-room', (room:string) => {
    socket.join(room);
    roomId = room;
    roomStore = serverStore.createRoomStore(room);
    roomStore.savePlayer(playerID);
    console.log(`Room with Id=${room} was created`);
  });

  socket.on('join-to-room', (room:string) => {
    roomStore = serverStore.getRoomStore(room);
    if (roomStore) {
      socket.join(room);
      console.log(`User with Id=${playerID} has joined to the room with Id=${room}`);
      roomId = room;
      roomStore.savePlayer(playerID);
      const joinResponse:JoinToRoomResponse = { 
        user: playerID, 
        usersInRoom: roomStore.getPlayers() 
      };
      gameRoomNamespace.to(room)
        .emit('user-joined', joinResponse);
    } else {
      console.log(`Failed to  join user with Id=${playerID} to the room with Id=${room}. Room not found.`);
    }
  });

  socket.on('word-range-selected', (words:Array<Word>) => {
    roomStore?.saveSelectedWordRange(playerID, words);
    console.log('Self => ', playerID);
    console.log('Roomstore => ', roomStore);
    socket.to(roomId).emit('word-range-selected', words);
  });

  socket.on('words-selected', (words:Array<Word>) => {
    const playersInRoom = roomStore?.getPlayers();
    const otherPlayer = playersInRoom?.find(id => id !== playerID) || '';
    const selectedWordRange = roomStore?.getSelectedWordRange(otherPlayer);
    if (selectedWordRange && selectedWordRange.length > 0) {
      roomStore?.saveSelectedWords(playerID, words);
      socket.to(roomId)
      .emit('words-selected', words.map(sWord => { 
          const { word, ...restWord } = sWord; 
          return restWord;
        })
      );
    }
    console.log('Self => ', playerID);
    console.log('Other player => ', otherPlayer);
    console.log('Roomstore => ', roomStore);
  }); 

  socket.on('send-attempt', (words:Array<Word>) => {
    const playersInRoom = roomStore?.getPlayers();
    const otherPlayer = playersInRoom?.find(id => id !== playerID) || '';
    const selectedWords = roomStore?.getSelectedWords(otherPlayer);
    if (selectedWords && selectedWords?.length > 0) {
      const attempts = words.map((word):AttemptCount => {
        const attempt = roomStore?.getAttempt(playerID, word.id);
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
          playerID, 
          roomStore.getPlayerPoints(playerID) + attemptPoints
      );
      const attemptResult:AttemptResponse = {  
        attemptPoints,
        points: { 
          [otherPlayer]: roomStore?.getPlayerPoints(otherPlayer) || 0, 
          [playerID]: playerPoints || 0
        },
        pointsPerWord
      };
      roomStore?.saveAttempt(playerID, checkResult);
      console.log('Self => ', playerID);
      console.log('Other player => ', otherPlayer);
      console.log('Roomstore => ', roomStore);
      gameRoomNamespace.to(roomId).emit('attempt-checked', attemptResult); 
    }
  });

  socket.on('disconnect', () => {
    const usersInRoom = roomStore?.getPlayers();
    console.log(`User with Id=${playerID} disconnected.`);
    gameRoomNamespace.to(roomId).emit('user-disconnected', playerID);
  });
});

server.listen(port, () => {
  console.log(`Running Wordcatch Server. \nListen on port ${port}`);
  console.log(`You can view the main page in http://localhost:${port}`);
});