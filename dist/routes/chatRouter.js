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
            const chatRoomList = yield findAllChatRoom(user_id);
            chatRoomList.forEach((room) => {
                socket.join(`${room.RoomName}`);
            });
        }));
        socket.on("join", (room, done) => {
            socket.join(room);
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
        socket.on("disconnecting", () => {
            socket.rooms.forEach((room) => socket.to(room).emit("notifyDisconnect", socket["nickname"]));
        });
        socket.on("send", (data, currentRoom) => __awaiter(void 0, void 0, void 0, function* () {
            const hostId = currentRoom.split("_")[0];
            const guestId = currentRoom.split("_")[1];
            if (yield checkUserOffline(io, +hostId)) {
                createMessageOffline({
                    payload: data.payload,
                    writerId: +guestId,
                    roomName: currentRoom,
                });
                return;
            }
            else if (yield checkUserOffline(io, +guestId)) {
                createMessageOffline({
                    payload: data.payload,
                    writerId: +hostId,
                    roomName: currentRoom,
                });
                return;
            }
            socket.to(currentRoom).emit("sendCallback", Object.assign(Object.assign({ nickname: socket["nickname"] }, data), { createdAt: Date.now() }));
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
        }));
    });
    module.exports = { socketIOHandler };
    function getRoom(hostId, guestId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma.chatRoom.findFirst({
                where: {
                    RoomName: getRoomName(+hostId, +guestId),
                },
                select: {
                    Room_id: true,
                },
            });
        });
    }
    function findAllChatRoom(user_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma.chatRoom.findMany({
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
        });
    }
    /**
     * 호스트 ID와 게스트 ID로 방 이름을 알아내는 함수
     * @param hostId
     * @param guestId
     * @returns
     */
    function getRoomName(hostId, guestId) {
        return `${hostId}_${guestId}`;
    }
    /**
     * 유저가 오프라인인 상대에게 메시지를 보내는 함수
     * @param payload
     * @param writerId
     * @param roomName
     */
    function createMessageOffline({ payload, writerId, roomName, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const hostId = +roomName.split("_")[0];
            const guestId = +roomName.split("_")[1];
            const room = yield prisma.chatRoom.findFirst({
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
    /**
     * 방에 참가하는 함수
     * @param socket
     * @param hostId
     * @param guestId
     * @param io
     */
    function joinRoom({ socket, hostId, guestId, io }) {
        return __awaiter(this, void 0, void 0, function* () {
            socket.join(getRoomName(hostId, guestId));
            io.sockets.sockets.forEach((sock) => {
                const user = sock;
                if (user["userId"] == guestId) {
                    const guest = user;
                    guest.join(getRoomName(hostId, guestId));
                }
            });
            socket.emit("getRoomName", getRoomName(hostId, guestId));
        });
    }
    /**
     * 유저가 오프라인인지 체크하는 함수
     * @param io
     * @param userId
     * @returns
     */
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
};
//# sourceMappingURL=../../src/map/routes/chatRouter.js.map