import express from "express";
import SocketIO from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import http from "http";
const chatRouter = express.Router();

type SocketIO = SocketIO.Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
>;

class Socket extends SocketIO.Socket {
  nickname!: string;
}

const socketIOHandler = (
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>,
) => {
  const io = new SocketIO.Server(server);
  io.on("connection", (s) => {
    const socket = s as Socket;
    socket["nickname"] = "Anonymous";
    socket.on("setNickname", (nick) => {
      socket["nickname"] = nick;
    });

    socket.on("join", (room, done) => {
      socket.join(room);
      done();
    });

    console.log(socket.rooms);

    socket.on("send", (data, room) => {
      console.log(data);
      socket.to(room).emit("receive", {
        nickname: socket["nickname"],
        ...data,
        createdAt: Date.now(),
      });
    });
  });
};

chatRouter.get("/", (req, res) => {
  try {
    res.json({ result: "connected" });
  } catch (err) {
    console.error(err);
    res.json({ result: "error" });
  }
});

module.exports = { chatRouter, socketIOHandler };
