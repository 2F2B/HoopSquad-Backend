"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = __importDefault(require("socket.io"));
const chatRouter = express_1.default.Router();
class Socket extends socket_io_1.default.Socket {
}
const socketIOHandler = (server) => {
    const io = new socket_io_1.default.Server(server);
    const chatNamespace = io.of("/chat");
    chatNamespace.on("connection", (s) => {
        const socket = s;
        socket.on("setNickname", (nick) => {
            socket["nickname"] = nick;
        });
        socket.join("test");
        console.log(socket.rooms);
        socket.on("send", (data, room) => {
            console.log(data);
            socket.to(room).emit("receive", Object.assign(Object.assign({ nickname: socket["nickname"] }, data), { createdAt: Date.now() }));
        });
    });
};
chatRouter.get("/", (req, res) => {
    try {
        const io = req.app.get("io");
        res.json({ result: "connected" });
    }
    catch (err) {
        console.error(err);
        res.json({ result: "error" });
    }
});
module.exports = { chatRouter, socketIOHandler };
