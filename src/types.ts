import { Socket } from "socket.io";

export type AttemptsCount = {
  count:number
  successful:boolean
  wordId:string
}

export type AttemptResponse = { 
  points:{ 
    player_1:number 
    player_2:number 
  }
  wordsAttempts:Array<AttemptsCount>
}

export interface CustomSocket extends Socket {
  connectionMode:string
  roomId:string
}

export type JoinToRoomEventResponse = { 
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