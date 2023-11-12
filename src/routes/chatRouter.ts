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

async function createRoom(hostId: number, guestId: number) {
  const isChatRoomExist = await prisma.chatRoom.findFirst({
    where: {
      AND: [{ Host_id: hostId }, { Guest_id: guestId }],
    },
  });
  if (!isChatRoomExist) {
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
  }
}

const socketIOHandler = (
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>,
) => {
  const io = new SocketIO.Server(server);
  io.on("connection", (s) => {
    const socket = s as Socket;

    socket.on("setNickname", (nick: string) => {
      socket["nickname"] = nick;
    });

    socket.on("setUserId", async (token: string) => {
      const user = await prisma.oAuthToken.findFirst({
        where: {
          AccessToken: token,
        },
        select: {
          User_id: true,
        },
      });
      socket["userId"] = user?.User_id!;
    });

    socket.on("joinAllRooms", async () => {
      const chatRoomList = await prisma.chatRoom.findMany({
        where: {
          OR: [{ Host_id: socket["userId"] }, { Guest_id: socket["userId"] }],
        },
      });

      chatRoomList.forEach((room) => {
        socket.join(`${room.Host_id}_${room.Guest_id}`);
      });
    });

    socket.on("join", (room, done) => {
      socket.join(room);
      done();
    });

    socket.on("makeRoom", async (guestId: number) => {
      const hostId = socket["userId"];

      await createRoom(hostId, guestId);

      socket.join(`${hostId}_${guestId}`);
      io.sockets.sockets.forEach((sock) => {
        const user = sock as Socket;
        if (user["userId"] == guestId) {
          const guest = user;
          guest.join(`${hostId}_${guestId}`);
        }
      });
    });

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
