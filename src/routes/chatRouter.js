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
        socket.on("getAllRooms", () => __awaiter(void 0, void 0, void 0, function* () {
            const chatRoomList = yield prisma.chatRoom.findMany({
                where: {
                    OR: [{ Host_id: socket["userId"] }, { Guest_id: socket["userId"] }],
                },
            });
        }));
        console.clear();
        console.log(io.sockets.adapter.rooms);
        socket.on("setNickname", (nick) => {
            socket["nickname"] = nick;
        });
        socket.on("setUserId", (token) => __awaiter(void 0, void 0, void 0, function* () {
            const user = yield prisma.oAuthToken.findFirst({
                where: {
                    AccessToken: token,
                },
                select: {
                    User_id: true,
                },
            });
            socket["userId"] = user === null || user === void 0 ? void 0 : user.User_id;
            console.log(socket["userId"]);
        }));
        socket.on("join", (room, done) => {
            socket.join(room);
            done();
        });
        socket.on("makeRoom", (guestId) => __awaiter(void 0, void 0, void 0, function* () {
            const hostId = socket["userId"];
            const isChatRoomExist = yield prisma.chatRoom.findFirst({
                where: {
                    AND: [{ Host_id: hostId }, { Guest_id: guestId }],
                },
            });
            if (!isChatRoomExist) {
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
                socket.join(`${hostId}_${guestId}`);
            }
        })); //FIXME: Host 소켓 개인 방에 Guest 소켓 Join시키기
        socket.on("disconnect", () => {
            console.clear();
            console.log(io.sockets.adapter.rooms);
        });
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
