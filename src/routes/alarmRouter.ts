import SocketIO from "socket.io";
import { applyMatch, getAlarm } from "../alarm/alarm";

const notificationServerHandler = (
  io: SocketIO.Namespace,
  chatServer: SocketIO.Server,
) => {
  io.on("connection", (socket) => {});
};

export default notificationServerHandler;
