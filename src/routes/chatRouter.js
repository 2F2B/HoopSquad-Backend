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
function createRoom(hostId, guestId) {
    return __awaiter(this, void 0, void 0, function* () {
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
        }
    });
}
function checkUserOnline(io, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        let result;
        io.sockets.sockets.forEach((s) => {
            const socket = s;
            if (socket["userId"] == userId) {
                return (result = true);
            }
        });
        if (result == true)
            return true;
        else
            return false;
    });
}
const socketIOHandler = (server) => {
    const io = new socket_io_1.default.Server(server);
    io.on("connection", (s) => {
        const socket = s;
        console.log(socket.rooms);
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
        }));
        socket.on("joinAllRooms", () => __awaiter(void 0, void 0, void 0, function* () {
            const chatRoomList = yield prisma.chatRoom.findMany({
                where: {
                    OR: [{ Host_id: socket["userId"] }, { Guest_id: socket["userId"] }],
                },
                select: {
                    Host_id: true,
                    Guest_id: true,
                },
            });
            chatRoomList.forEach((room) => {
                socket.join(`${room.Host_id}_${room.Guest_id}`);
            });
        }));
        socket.on("join", (room, done) => {
            socket.join(room);
            console.log(socket.rooms);
            done();
        });
        socket.on("makeRoom", (guestId) => __awaiter(void 0, void 0, void 0, function* () {
            const hostId = socket["userId"];
            yield createRoom(hostId, guestId);
            socket.join(`${hostId}_${guestId}`);
            io.sockets.sockets.forEach((sock) => {
                const user = sock;
                if (user["userId"] == guestId) {
                    const guest = user;
                    guest.join(`${hostId}_${guestId}`);
                }
            });
            socket.emit("getRoomName", `${hostId}_${guestId}`);
        }));
        socket.on("disconnect", () => { });
        socket.on("send", (data, room) => __awaiter(void 0, void 0, void 0, function* () {
            console.log(data);
            // const hostId = room.split("_")[0];
            // const guestId = room.split("_")[1];
            // if (socket["userId"] == +hostId) {
            //   const result = await checkUserOnline(io, +hostId);
            // }
            socket.to(room).emit("receive", Object.assign(Object.assign({ nickname: socket["nickname"] }, data), { createdAt: Date.now() }));
        }));
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
