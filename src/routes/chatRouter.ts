import express from "express";
import SocketIO from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
const chatRouter = express.Router();

type SocketIO = SocketIO.Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
>;

const socketIOHandler = (server: any) => {
  const io = new SocketIO.Server(server);

  io.of("/chat").on("connection", (socket) => {
    socket.on("message", (data) => {
      console.log(`Message from Frontend: ${data}`);
    });
  });
};

chatRouter.get("/", (req, res) => {
  try {
    const io = req.app.get("io") as SocketIO;
    res.json({ result: "connected" });
  } catch (err) {
    console.error(err);
    res.json({ result: "error" });
  }
});

module.exports = { chatRouter, socketIOHandler };
