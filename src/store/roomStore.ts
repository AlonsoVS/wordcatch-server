import { AttemptCount, Word } from "../types";

export type PlayerData = {
  attempts:Array<AttemptCount>  
  points:number
  selectedWords:Array<Word>
  selectedWordRange:Array<Word>
}

interface WithMaxAttempts {
  maxAttemptsToGuess?:number
}

export class RoomStore {
  private data: {
    [userId:string]:PlayerData
  } & WithMaxAttempts;
  
  public constructor() {
    this.data = {};
  }

  private createPlayerData():PlayerData {
    return {
      attempts: [], 
      points: 0, 
      selectedWords: [], 
      selectedWordRange: []
    }
  }

  public setMaxAttemptsToGuess(value:number) {
    this.data.maxAttemptsToGuess = value;
  }

  public getMaxAttemptsToGuess():number {
    return this.data.maxAttemptsToGuess || 3;
  }
  
  public savePlayer(playerId:string, data?:PlayerData):void {
    if (data) {
      this.data[playerId] = data;
    } else {
      this.data[playerId] = this.createPlayerData();
    }
  }

  public getPlayerData(playerId:string):PlayerData {
    return this.data[playerId];
  }

  public getPlayers():Array<string> {
    return Object.keys(this.data);
  }

  public saveAttempt(playerId:string, attempt:AttemptCount[]):void {
    this.data[playerId].attempts = this.data[playerId].attempts.concat(attempt);
  }

  public getAttempt(playerId:string, wordId:string):AttemptCount|null {
    return this.data[playerId].attempts
      .filter(attempt => attempt.wordId === wordId)
      .sort((a,b) => b.count-a.count)[0];
  }

  public saveSelectedWordRange(playerId:string, wordRange:Array<Word>):void {
    this.data[playerId].selectedWordRange = wordRange;
  }

  public getSelectedWordRange(playerId:string):Array<Word> {
    return this.data[playerId].selectedWordRange;
  }

  public saveSelectedWords(playerId:string, selectedWords:Array<Word>):void {
    this.data[playerId].selectedWords = selectedWords;
  }

  public getSelectedWords(playerId:string):Array<Word> {
    return this.data[playerId].selectedWords;
  }

  public updatePlayerPoints(playerId:string, points:number):number {
    this.data[playerId].points = points;
    return this.data[playerId].points;
  }

  public getPlayerPoints(playerId:string):number {
    return this.data[playerId].points;
  }
}

type Store = {
  [roomId:string]:RoomStore
}

export class InMemoryStore {
  private store:Store;
  public constructor() {
    this.store = {};
  }

  public createRoomStore(roomId:string):RoomStore {
    this.store[roomId] = new RoomStore();
    return this.store[roomId];
  }

  public getRoomStore(roomId:string):RoomStore {
    return this.store[roomId];
  }
}