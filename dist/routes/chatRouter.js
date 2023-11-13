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
function createMessageOffline({ payload, writerId, receiverId, isWriterHost, }) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma.message.create({
            data: {
                Msg: payload,
                Writer_id: writerId.toString(),
                Receiver_id: receiverId.toString(),
                ChatRoom: {
                    create: {
                        Host_id: isWriterHost ? writerId : receiverId,
                        Guest_id: isWriterHost ? receiverId : writerId,
                    },
                },
            },
        });
    });
}
function createRoom(hostId, guestId) {
    return __awaiter(this, void 0, void 0, function* () {
        const isChatRoomExist = yield prisma.chatRoom.findFirst({
            where: {
                RoomName: getRoomName(hostId, guestId),
            },
            select: {
                Room_id: true,
            },
        });
        yield prisma.message.create({
            data: {
                Msg: payload,
                User_id: writerId,
                Room_id: room === null || room === void 0 ? void 0 : room.Room_id,
            },
        });
    });
}
/**
 * 방 생성 함수
 * @param hostId
 * @param guestId
 */
function createRoom(hostId, guestId) {
    return __awaiter(this, void 0, void 0, function* () {
        const isChatRoomExist = yield prisma.chatRoom.findMany({
            where: {
                AND: [{ Host_id: hostId }, { RoomName: getRoomName(hostId, guestId) }],
            },
        });
        if (isChatRoomExist.length == 0) {
            yield prisma.chatRoom.create({
                data: {
                    Host_id: hostId,
                    RoomName: getRoomName(hostId, guestId),
                },
            });
        }
    });
}
function checkUserOffline(io, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        let isOnline;
        io.sockets.sockets.forEach((s) => {
            const socket = s;
            if (socket["userId"] == userId) {
                return (isOnline = true);
            }
        });
        if (isOnline == true)
            return false;
        else
            return true;
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
        socket.on("setUserId", (id, done) => __awaiter(void 0, void 0, void 0, function* () {
            // const user = await prisma.oAuthToken.findFirst({
            //   where: {
            //     AccessToken: token,
            //   },
            //   select: {
            //     User_id: true,
            //   },
            // });
            socket["userId"] = id;
            done();
        }));
        socket.on("joinAllRooms", (user_id) => __awaiter(void 0, void 0, void 0, function* () {
            const chatRoomList = yield prisma.chatRoom.findMany({
                where: {
                    OR: [
                        {
                            Host_id: user_id,
                        },
                        {
                            Message: {
                                some: {
                                    User_id: user_id,
                                },
                            },
                        },
                    ],
                },
                select: {
                    RoomName: true,
                },
            });
            chatRoomList.forEach((room) => {
                socket.join(`${room.RoomName}`);
            });
            console.log(socket.rooms);
        }));
        socket.on("join", (room, done) => {
            socket.join(room);
            console.log(socket.rooms);
            done();
        });
        socket.on("makeRoom", (guestId, done) => __awaiter(void 0, void 0, void 0, function* () {
            const hostId = socket["userId"];
            yield createRoom(hostId, guestId);
            yield joinRoom({
                socket: socket,
                hostId: hostId,
                guestId: guestId,
                io: io,
            });
            socket
                .to(getRoomName(hostId, guestId))
                .emit("makeRoomCallback", getRoomName(hostId, guestId));
            done(getRoomName(hostId, guestId));
        }));
        socket.on("disconnect", () => { });
        socket.on("send", (data, currentRoom) => __awaiter(void 0, void 0, void 0, function* () {
            const hostId = +currentRoom.split("_")[0];
            const guestId = +currentRoom.split("_")[1];
            if (yield checkUserOffline(io, hostId)) {
                createMessageOffline({
                    payload: data.payload,
                    writerId: guestId,
                    receiverId: hostId,
                    isWriterHost: false,
                });
                socket.to(currentRoom).emit("userLeft");
                return;
            }
            else if (yield checkUserOffline(io, guestId)) {
                createMessageOffline({
                    payload: data.payload,
                    writerId: hostId,
                    receiverId: guestId,
                    isWriterHost: true,
                });
                socket.to(currentRoom).emit("userLeft");
                return;
            }
            console.log(data);
            socket.to(currentRoom).emit("receive", Object.assign(Object.assign({ nickname: socket["nickname"] }, data), { createdAt: Date.now() }));
        }));
    });
};
//CHECKLIST
//[x]: 닉네임 설정
//[x]: 유저 아이디 설정
//[x]: 방 참가
//[x]: 방 생성
//[x]: 메시지 전송
//[x]: 연결 끊기
//[x]: 데이터베이스 연동
//[ ]: 재접속 시 소켓 방 참가 로직 구현 및 테스트
module.exports = { socketIOHandler };
//# sourceMappingURL=../../src/map/routes/chatRouter.js.map