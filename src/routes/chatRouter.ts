import SocketIO from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import http from "http";
import { PrismaClient } from "@prisma/client";

type SocketIO = SocketIO.Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
>;

const prisma = new PrismaClient();
class Socket extends SocketIO.Socket {
  nickname!: string;
  userId!: number;
}

const socketIOHandler = (
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>,
) => {
  const io = new SocketIO.Server(server);
  io.on("connection", (s) => {
    const socket = s as Socket;

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

    socket.on("init", async (hostId, guestId, hostSocketId) => {
      const chatRoom = await prisma.chatRoom.create({
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
      await prisma.chatRelay.create({
        data: {
          User_id: guestId,
          Room_id: chatRoom.Room_id,
        },
      });
    }); //FIXME: Host 소켓 개인 방에 Guest 소켓 Join시키기

    socket.on("disconnect", () => {});

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

//CHECKLIST
//[x]: 닉네임 설정
//[x]: 유저 아이디 설정
//[x]: 방 참가
//[x]: 방 생성
//[x]: 메시지 전송
//[ ]: 연결 끊기
//[ ]: 데이터베이스 연동

module.exports = { socketIOHandler };
