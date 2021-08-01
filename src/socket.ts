import { Server as HttpServer } from "http";
import { Server } from "socket.io";

const io = (server:HttpServer):Server => {
  return new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ["GET", "POST"]
    }
  });
};

export default io;