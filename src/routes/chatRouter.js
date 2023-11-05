"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = __importDefault(require("socket.io"));
const chatRouter = express_1.default.Router();
const socketIOHandler = (server) => {
    const io = new socket_io_1.default.Server(server);
    io.of("/chat").on("connection", (socket) => {
        console.log("A user connected to the chat namespace");
        socket.on("message", (data) => {
            console.log(`Message from Frontend: ${data}`);
            socket.emit("alert", data);
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
