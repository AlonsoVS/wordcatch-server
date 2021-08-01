import { Socket } from "socket.io";

export interface CustomSocket extends Socket {
  connectionMode:string
  roomId:string
}

export type PlayTurn = {
  mode:string,
  words:Array<any>
}