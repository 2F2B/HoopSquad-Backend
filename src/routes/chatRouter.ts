import SocketIO, { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { PrismaClient } from "@prisma/client";
import { UserNotExistError } from "../auth/error";
import fs from "fs";
import { SocketIoServerType } from "..";

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

type enterRoomType = {
  Message_id: number;
  Posting_id: number;
  Msg: string;
  ChatTime: Date;
  User_id: number;
};

type chatRoomsType = {
  nickname: string;
  lastChatMessage: string | undefined;
  image: string | undefined;
  lastChatTime: string | undefined;
  postingId: number;
  postingTitle: string;
};

const prisma = new PrismaClient();

type joinRoomType = {
  socket: Socket;
  guestId: number;
  io: SocketIO.Server;
  postingId: number;
};

const socketIOHandler = (server: SocketIoServerType) => {
  const io = new SocketIO.Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    socket.on(
      "joinAllRooms",
      async (user_id: number, done: (chatRooms: chatRoomsType[]) => void) => {
        const chatRoomList = await findAllChatRoom(user_id);
        const chatRooms = await joinAllRooms(chatRoomList, socket, user_id);
        done(chatRooms);
      },
    );

    socket.on(
      "makeRoom",
      async (
        hostId: number,
        guestId: number,
        postingId: number,
        done: () => void,
      ) => {
        await createRoom(hostId, guestId, postingId);
        await joinRoom({
          socket: socket,
          guestId: guestId,
          io: io,
          postingId: postingId,
        });
        console.log(`RoomName: ${postingId}`);
        done();
      },
    );

    socket.on(
      "enterRoom",
      async (postingId: number, done: (chatList: enterRoomType[]) => void) => {
        const room = await findRoomByPostingId(postingId);
        const chatList = await prisma.message.findMany({
          where: {
            Room_id: room.Room_id,
          },
          select: {
            Message_id: true,
            Msg: true,
            ChatTime: true,
            User_id: true,
          },
        });

        const chatListWithPostingId = chatList.map((chat) => ({
          ...chat,
          Posting_id: postingId,
        }));
        done(chatListWithPostingId);
      },
    );

    socket.on(
      "send",
      async (
        nickname: string,
        userId: number,
        payload: string,
        postingId: number,
        done: () => void,
      ) => {
        const currentTimestamp = getCurrentTimestamp();

        const post = await prisma.posting.findFirstOrThrow({
          where: {
            Posting_id: postingId,
          },
          select: {
            Title: true,
          },
        });

        // if (await checkUserOffline(io, +hostId)) {
        // } else if (await checkUserOffline(io, +guestId)) {
        // }
        const room = await findRoomByPostingId(postingId);
        const newMessage = await prisma.message.create({
          data: {
            Msg: payload,
            User_id: userId,
            Room_id: room.Room_id,
          },
        });

        io.to(getRoomName(postingId)).emit("send", {
          Message_id: newMessage.Message_id,
          Posting_id: postingId,
          Msg: payload,
          ChatTime: currentTimestamp,
          User_id: userId,
        });

        io.to(getRoomName(postingId)).emit("updateChatRoom", {
          nickname: nickname,
          lastChatMessage: payload,
          lastChatTime: currentTimestamp,
          postingId: postingId,
          postingTitle: post.Title,
        });

        done();
      },
    );
  });
};

export default socketIOHandler;

function getCurrentTimestamp() {
  return Date.now();
}

async function findRoomByPostingId(postingId: number) {
  const room = await prisma.chatRoom.findFirst({
    where: {
      Posting_id: postingId,
    },
    select: {
      Room_id: true,
    },
  });
  if (!room) throw new Error("Room Not Exist");
  return room;
}

async function joinAllRooms(
  chatRoomList: { Room_id: number; Posting_id: number }[],
  socket: SocketIO.Socket<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    any
  >,
  user_id: number,
) {
  return await Promise.all(
    chatRoomList.map(async (room) => {
      socket.join(getRoomName(room.Posting_id));
      const opponentName = await findOpponentInfo(room, user_id);
      const lastChat = await getLastChat(room.Room_id);
      let imageName = await findPostingImageName(room.Posting_id);
      const postingName = await findPostingName(room);

      return {
        nickname: opponentName.Name,
        lastChatMessage: lastChat?.Msg,
        image: imageName,
        lastChatTime: lastChat?.ChatTime.toISOString(),
        postingId: room.Posting_id,
        postingTitle: postingName.Title,
      };
    }),
  );
}

async function findPostingName(room: { Room_id: number; Posting_id: number }) {
  const postingName = await prisma.posting.findFirst({
    where: {
      Posting_id: room.Posting_id,
    },
    select: {
      Title: true,
    },
  });

  if (!postingName) throw new Error("Posting Not Found");
  return postingName;
}

async function findPostingImageName(postingId: number) {
  const postImage = await prisma.image.findFirst({
    where: {
      Posting_id: postingId,
    },
    select: {
      ImageData: true,
    },
  });
  return postImage?.ImageData;
}

async function findOpponentInfo(
  room: { Room_id: number; Posting_id: number },
  user_id: number,
) {
  const opponent = await prisma.chatRoom.findFirst({
    where: {
      AND: [{ Posting_id: room.Posting_id }, { User_id: { not: user_id } }],
    },
    select: {
      User_id: true,
    },
  });
  if (!opponent) throw new UserNotExistError();

  const opponentName = await prisma.user.findFirst({
    where: {
      User_id: opponent.User_id,
    },
  });
  if (!opponentName) throw new UserNotExistError();
  return opponentName;
}

async function findAllChatRoom(user_id: number) {
  return await prisma.chatRoom.findMany({
    where: {
      User_id: user_id,
    },
    select: {
      Posting_id: true,
      Room_id: true,
    },
  });
}

/**
 * 방 생성 함수
 * @param hostId
 * @param guestId
 * @param postingId
 */
async function createRoom(hostId: number, guestId: number, postingId: number) {
  const isChatRoomExist = await prisma.chatRoom.findFirst({
    where: {
      Posting_id: postingId,
    },
  });
  if (!isChatRoomExist) {
    await prisma.chatRoomList.create({
      data: {
        ChatRoom: {
          createMany: {
            data: [
              {
                User_id: hostId,
                IsHost: true,
                Posting_id: postingId,
              },
              {
                User_id: guestId,
                Posting_id: postingId,
              },
            ],
          },
        },
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
async function joinRoom({ socket, guestId, io, postingId }: joinRoomType) {
  socket.join(getRoomName(postingId)); //호스트 방 참여 완료
  io.sockets.sockets.forEach((socket) => {
    const user = socket;
    user.emit("getUserId", (id: number) => {
      if (id == guestId) {
        const guest = user;
        guest.join(getRoomName(postingId));
      }
    });
  });
}

function getRoomName(postingId: number): string {
  return `${postingId}`;
}

// /**
//  * 유저가 오프라인인지 체크하는 함수
//  * @param io
//  * @param userId
//  * @returns
//  */
// async function checkUserOffline(io: SocketIO.Server, userId: number) {
//   let isOnline;
//   io.sockets.sockets.forEach((socket) => {
//     socket.emit("getUserId", (id: number) => {
//       if (id == userId) {
//         return (isOnline = true);
//       }
//     });
//   });
//   if (isOnline == true) return false;
//   else return true;
// }

async function getLastChat(room_id: number) {
  return await prisma.message.findFirst({
    where: {
      Room_id: room_id,
    },
    orderBy: {
      ChatTime: "desc",
    },
    select: {
      Msg: true,
      ChatTime: true,
    },
  });
}

// async function getUnreadMessage(room_id: number) {
//   return await prisma.message.findMany({
//     where: {
//       IsRead: false,
//     },
//   });
// }
