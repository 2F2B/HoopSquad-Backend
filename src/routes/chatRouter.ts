import SocketIO from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import http from "http";
import { PrismaClient } from "@prisma/client";
import { UserNotExistError } from "../auth/error";
import fs from "fs";

//CHECKLIST
//[x]: 닉네임 설정
//[x]: 유저 아이디 설정
//[x]: 방 참가
//[x]: 방 생성
//[x]: 메시지 전송
//[x]: 연결 끊기
//[x]: 데이터베이스 연동
//[x]: 재접속 시 소켓 방 참가 로직 구현 및 테스트

type SocketIO = SocketIO.Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
>;

type chatRoomsType = {
  nickname: string;
  image?: Buffer;
  lastChatMessage?: string;
  lastChatTime?: string;
  unreadMessageAmount: number;
  roomName: string;
};

const prisma = new PrismaClient();

class Socket extends SocketIO.Socket {
  nickname!: string;
  userId!: number;
}

type createMessageOfflineType = {
  payload: string;
  writerId: number;
  roomName: string;
};

type joinRoomType = {
  socket: Socket;
  hostId: number;
  guestId: number;
  io: SocketIO.Server;
};

function getUserIdFromChatroomName(user_id: number, roomName: string) {
  if (+roomName.split("_")[0] == user_id) return +roomName.split("_")[1];
  else return +roomName.split("_")[0];
}

const socketIOHandler = (
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>,
) => {
  const io = new SocketIO.Server(server, {
    cors: {
      origin: "*",
    },
  });
  io.on("connection", (s) => {
    const socket = s as Socket;

    socket.on("setNickname", (nick: string, done: () => void) => {
      socket["nickname"] = nick;
      done();
    });

    socket.on("setUserId", async (id: number, done: () => void) => {
      socket["userId"] = id;
      done();
    });

    socket.on(
      "joinAllRooms",
      async (
        user_id: number,
        done: (chatRooms: chatRoomsType[]) => Promise<void>,
      ) => {
        const chatRoomList = await findAllChatRoom(user_id);

        const chatRooms = await Promise.all(
          chatRoomList.map(async (room) => {
            socket.join(`${room.RoomName}`);
            const opponent = await prisma.user.findFirst({
              where: {
                User_id: getUserIdFromChatroomName(user_id, room.RoomName),
              },
            });

            if (!opponent) throw new UserNotExistError();
            const lastChat = await getLastChat(room.Room_id);

            const unreadMessages = await prisma.message.findMany({
              where: {
                AND: [{ IsRead: false }, { Room_id: room.Room_id }],
              },
              select: {
                Msg: true,
              },
            });

            const userImage = await prisma.image.findFirst({
              where: {
                Profile_id: opponent.User_id,
              },
              select: {
                ImageData: true,
              },
            });
            let imageData: Buffer | undefined;
            if (userImage?.ImageData) {
              imageData = fs.readFileSync(
                `../image/user/${userImage?.ImageData}`,
              );
            } else imageData = undefined;

            return {
              nickname: opponent.Name,
              lastChatMessage: lastChat?.Msg,
              image: imageData,
              lastChatTime: lastChat?.ChatTime.toISOString(),
              unreadMessageAmount: unreadMessages.length,
              roomName: room.RoomName,
            };
          }),
        );

        done(chatRooms);
      },
    );

    socket.on(
      "makeRoom",
      async (post_id: number, done: (roomName: string) => void) => {
        const post = await prisma.posting.findFirst({
          where: {
            Posting_id: post_id,
          },
        });
        const guestId = post?.User_id;
        if (!guestId) throw new UserNotExistError();
        const hostId = socket["userId"];
        await createRoom(hostId, guestId);
        await joinRoom({
          socket: socket,
          hostId: hostId,
          guestId: guestId,
          io: io,
        });
        done(getRoomName(hostId, guestId));
      },
    );

    socket.on(
      "enterRoom",
      async (
        roomName: string,
        done: (
          chatList: {
            Message_id: number;
            Room_id: number;
            Msg: string;
            ChatTime: Date;
            User_id: number;
            IsRead: boolean;
          }[],
        ) => void,
      ) => {
        const roomId = await prisma.chatRoom.findFirst({
          where: {
            RoomName: roomName,
          },
          select: {
            Room_id: true,
          },
        });
        if (!roomId) throw new Error("Room Not Found");
        const chatList = await prisma.message.findMany({
          where: {
            Room_id: roomId.Room_id,
          },
        });

        done(chatList);
      },
    );

    socket.on("disconnecting", () => {
      socket.rooms.forEach((room) =>
        socket.to(room).emit("broadcastDisconnect", socket["nickname"]),
      );
    });

    socket.on(
      "send",
      async (payload: string, currentRoom: string, done: () => void) => {
        const hostId = currentRoom.split("_")[0];
        const guestId = currentRoom.split("_")[1];

        socket.to(currentRoom).emit("send", {
          nickname: socket["nickname"],
          payload,
          createdAt: Date.now(),
        });

        if (await checkUserOffline(io, +hostId)) {
          createMessageOffline({
            payload: payload,
            writerId: +guestId,
            roomName: currentRoom,
          });
          return;
        } else if (await checkUserOffline(io, +guestId)) {
          createMessageOffline({
            payload: payload,
            writerId: +hostId,
            roomName: currentRoom,
          });
          return;
        }

        const roomId = await getRoomId(hostId, guestId);

        await prisma.message.create({
          data: {
            Msg: payload,
            User_id: socket["userId"],
            Room_id: roomId,
          },
        });

        done();
      },
    );
  });
};

export default socketIOHandler;

async function getRoomId(hostId: string, guestId: string) {
  const chatRoom = await prisma.chatRoom.findFirst({
    where: {
      RoomName: getRoomName(+hostId, +guestId),
    },
    select: {
      Room_id: true,
    },
  });

  return chatRoom?.Room_id!!;
}

async function findAllChatRoom(user_id: number) {
  return await prisma.chatRoom.findMany({
    where: {
      User_id: user_id,
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
  return `${guestId}_${hostId}`;
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
  const room = await prisma.chatRoom.findFirst({
    where: {
      RoomName: roomName,
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
      AND: [{ User_id: hostId }, { RoomName: getRoomName(hostId, guestId) }],
    },
  });
  if (isChatRoomExist.length == 0) {
    await prisma.chatRoom.createMany({
      data: [
        {
          User_id: hostId,
          IsHost: true,
          RoomName: getRoomName(hostId, guestId),
        },
        {
          User_id: guestId,
          RoomName: getRoomName(hostId, guestId),
        },
      ],
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

async function getLastChat(room_id: number) {
  return await prisma.message.findFirst({
    where: {
      Room_id: room_id,
    },
    orderBy: {
      ChatTime: "desc",
    },
  });
}

async function getUnreadMessage(room_id: number) {
  return await prisma.message.findMany({
    where: {
      IsRead: false,
    },
  });
}
