import SocketIO from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import http from "http";
import { PrismaClient } from "@prisma/client";

//CHECKLIST
//[x]: 닉네임 설정
//[x]: 유저 아이디 설정
//[x]: 방 참가
//[x]: 방 생성
//[x]: 메시지 전송
//[x]: 연결 끊기
//[x]: 데이터베이스 연동
//[ ]: 재접속 시 소켓 방 참가 로직 구현 및 테스트

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

type createMessageOfflineType = {
  payload: string;
  writerId: number;
  receiverId: number;
  isWriterHost: boolean;
};

async function createMessageOffline({
  payload,
  writerId,
  receiverId,
  isWriterHost,
}: createMessageOfflineType) {
  await prisma.message.create({
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
}

async function createRoom(hostId: number, guestId: number) {
  const isChatRoomExist = await prisma.chatRoom.findFirst({
    where: {
      RoomName: getRoomName(hostId, guestId),
    },
    select: {
      Room_id: true,
    },
  });
  await prisma.message.create({
    data: {
      Msg: payload,
      User_id: writerId,
      Room_id: room?.Room_id!!,
    },
  });
}

/**
 * 방 생성 함수
 * @param hostId
 * @param guestId
 */
async function createRoom(hostId: number, guestId: number) {
  const isChatRoomExist = await prisma.chatRoom.findMany({
    where: {
      AND: [{ Host_id: hostId }, { RoomName: getRoomName(hostId, guestId) }],
    },
  });
  if (isChatRoomExist.length == 0) {
    await prisma.chatRoom.create({
      data: {
        Host_id: hostId,
        RoomName: getRoomName(hostId, guestId),
      },
    });
  }
}

async function checkUserOffline(io: SocketIO.Server, userId: number) {
  let isOnline;
  io.sockets.sockets.forEach((s) => {
    const socket = s as Socket;
    if (socket["userId"] == userId) {
      return (isOnline = true);
    }
  });
  if (isOnline == true) return false;
  else return true;
}

const socketIOHandler = (
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>,
) => {
  const io = new SocketIO.Server(server);
  io.on("connection", (s) => {
    const socket = s as Socket;
    console.log(socket.rooms);

    socket.on("setNickname", (nick: string) => {
      socket["nickname"] = nick;
    });

    socket.on("setUserId", async (id: number, done: Function) => {
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
    });

    socket.on("joinAllRooms", async (user_id: number) => {
      const chatRoomList = await prisma.chatRoom.findMany({
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
    });

    socket.on("join", (room, done) => {
      socket.join(room);
      done();
    });

    socket.on("makeRoom", async (guestId: number, done: Function) => {
      const hostId = socket["userId"];
      await createRoom(hostId, guestId);
      await joinRoom({
        socket: socket,
        hostId: hostId,
        guestId: guestId,
        io: io,
      });
      socket
        .to(getRoomName(hostId, guestId))
        .emit("makeRoomCallback", getRoomName(hostId, guestId));
      done(getRoomName(hostId, guestId));
    });

    socket.on("disconnecting", () => {
      socket.rooms.forEach((room) =>
        socket.to(room).emit("broadcastDisconnect", socket["nickname"]),
      );
    });

    socket.on(
      "send",
      async (data: { payload: string }, currentRoom: string) => {
        const hostId = currentRoom.split("_")[0];
        const guestId = currentRoom.split("_")[1];

        if (await checkUserOffline(io, +hostId)) {
          createMessageOffline({
            payload: data.payload,
            writerId: +guestId,
            roomName: currentRoom,
          });

          return;
        } else if (await checkUserOffline(io, +guestId)) {
          createMessageOffline({
            payload: data.payload,
            writerId: +hostId,
            roomName: currentRoom,
          });

          return;
        }

        console.log(data);
        socket.to(currentRoom).emit("receive", {
          nickname: socket["nickname"],
          ...data,
          createdAt: Date.now(),
        });

    socket.on(
      "send",
      async (data: { payload: string }, currentRoom: string) => {
        const hostId = +currentRoom.split("_")[0];
        const guestId = +currentRoom.split("_")[1];

        if (await checkUserOffline(io, hostId)) {
          createMessageOffline({
            payload: data.payload,
            writerId: guestId,
            receiverId: hostId,
            isWriterHost: false,
          });
          socket.to(currentRoom).emit("userLeft");
          return;
        } else if (await checkUserOffline(io, guestId)) {
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
        socket.to(currentRoom).emit("receive", {
          nickname: socket["nickname"],
          ...data,
          createdAt: Date.now(),
        });
      },
    );
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

async function getRoom(hostId: string, guestId: string) {
  return await prisma.chatRoom.findFirst({
    where: {
      RoomName: getRoomName(+hostId, +guestId),
    },
    select: {
      Room_id: true,
    },
  });
}

async function findAllChatRoom(user_id: number) {
  return await prisma.chatRoom.findMany({
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
}

/**
 * 호스트 ID와 게스트 ID로 방 이름을 알아내는 함수
 * @param hostId
 * @param guestId
 * @returns
 */
function getRoomName(hostId: number, guestId: number) {
  return `${hostId}_${guestId}`;
}

/**
 * 유저가 오프라인인 상대에게 메시지를 보내는 함수
 * @param payload
 * @param writerId
 * @param roomName
 */
async function createMessageOffline({
  payload,
  writerId,
  roomName,
}: createMessageOfflineType): Promise<void> {
  const hostId = +roomName.split("_")[0];
  const guestId = +roomName.split("_")[1];
  const room = await prisma.chatRoom.findFirst({
    where: {
      RoomName: getRoomName(hostId, guestId),
    },
    select: {
      Room_id: true,
    },
  });
  await prisma.message.create({
    data: {
      Msg: payload,
      User_id: writerId,
      Room_id: room?.Room_id!!,
    },
  });
}

/**
 * 방 생성 함수
 * @param hostId
 * @param guestId
 */
async function createRoom(hostId: number, guestId: number) {
  const isChatRoomExist = await prisma.chatRoom.findMany({
    where: {
      AND: [{ Host_id: hostId }, { RoomName: getRoomName(hostId, guestId) }],
    },
  });
  if (isChatRoomExist.length == 0) {
    await prisma.chatRoom.create({
      data: {
        Host_id: hostId,
        RoomName: getRoomName(hostId, guestId),
      },
    });
  }
}

/**
 * 방에 참가하는 함수
 * @param socket
 * @param hostId
 * @param guestId
 * @param io
 */
async function joinRoom({ socket, hostId, guestId, io }: joinRoomType) {
  socket.join(getRoomName(hostId, guestId));
  io.sockets.sockets.forEach((sock) => {
    const user = sock as Socket;
    if (user["userId"] == guestId) {
      const guest = user;
      guest.join(getRoomName(hostId, guestId));
    }
  });
  socket.emit("getRoomName", getRoomName(hostId, guestId));
}

/**
 * 유저가 오프라인인지 체크하는 함수
 * @param io
 * @param userId
 * @returns
 */
async function checkUserOffline(io: SocketIO.Server, userId: number) {
  let isOnline;
  io.sockets.sockets.forEach((s) => {
    const socket = s as Socket;
    if (socket["userId"] == userId) {
      return (isOnline = true);
    }
  });
  if (isOnline == true) return false;
  else return true;
}
