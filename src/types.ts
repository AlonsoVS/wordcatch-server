import { Socket } from "socket.io";
import { WordPoints } from "./utils/pointsCounter";

export type AttemptCount = {
  count:number
  successful:boolean
  wordId:string
}

export type AttemptResponse = { 
  attemptPoints:number
  points:{ 
    [player:string]:number 
  }
  pointsPerWord:Array<WordPoints>
}

export interface CustomSocket extends Socket {
  playerSessionID:string
  roomId:string
}

export type JoinToRoomResponse = { 
  user:string, 
  usersInRoom:Array<string>
}

export type PlayTurn = {
  mode:string
  words:Array<Word>
}

export type Definition = {
  antonyms:Array<any>
  definition:string
  synonyms: Array<any>
}

export type Word = {
  definitions:Array<Definition>
	id: string
  partOfSpeech:string
  word?:string
}