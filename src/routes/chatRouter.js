"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = __importDefault(require("socket.io"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class Socket extends socket_io_1.default.Socket {
}
const socketIOHandler = (server) => {
    const io = new socket_io_1.default.Server(server);
    io.on("connection", (s) => {
        const socket = s;
        socket.on("setNickname", (nick) => {
            socket["nickname"] = nick;
        });
        socket.on("setUserId", (id) => {
            socket["userId"] = id;
        });
        socket.on("join", (room, done) => {
            socket.join(room);
            done();
        });
        socket.on("init", (hostId, guestId, hostSocketId) => __awaiter(void 0, void 0, void 0, function* () {
            const chatRoom = yield prisma.chatRoom.create({
                data: {
                    Host_id: hostId,
                    Guest_id: guestId,
                    ChatRelay: {
                        create: {
                            User_id: hostId,
                        },
                    },
                },
            });
            yield prisma.chatRelay.create({
                data: {
                    User_id: guestId,
                    Room_id: chatRoom.Room_id,
                },
            });
        })); //FIXME: Host 소켓 개인 방에 Guest 소켓 Join시키기
        socket.on("disconnect", () => { });
        socket.on("send", (data, room) => {
            console.log(data);
            socket.to(room).emit("receive", Object.assign(Object.assign({ nickname: socket["nickname"] }, data), { createdAt: Date.now() }));
        });
    });
};
//CHECKLIST
//[x]: 닉네임 설정
//[x]: 유저 아이디 설정
//[x]: 방 참가
//[x]: 방 생성
//[x]: 메시지 전송
//[ ]: 연결 끊기
//[ ]: 데이터베이스 연동
module.exports = { socketIOHandler };
