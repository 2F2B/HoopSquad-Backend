import { PrismaClient } from "@prisma/client";
import Expo from "expo-server-sdk";
import { getToken } from "./pushNotification";
const prisma = new PrismaClient();
const expo = new Expo();

/**
 * 특정 사용자의 모든 매치 알림을 반환하는 함수
 * @param userId
 * @returns
 */
async function getPostingAlarm(userId: number) {
  const alarms = await prisma.matchAlarm.findMany({
    where: {
      OR: [{ User_id: userId }, { Opponent_id: userId }],
    },
  });

  const alarmList: {
    image: string | undefined;
    nickname: string;
    guestId: number;
    postingId: number;
    postingTitle: string;
    isApply: boolean | null;
    createdAt: Date;
  }[] = [];

  for (const alarm of alarms) {
    const opponentProfile = await prisma.profile.findFirstOrThrow({
      where: {
        User_id: alarm.Opponent_id,
      },
      select: {
        Profile_id: true,
        User: true,
      },
    });
    const postingName = (
      await prisma.posting.findFirstOrThrow({
        where: {
          Posting_id: alarm.Posting_id,
        },
        select: {
          Title: true,
        },
      })
    ).Title;

    const userImage = await prisma.image.findFirst({
      where: {
        Profile_id: opponentProfile.Profile_id,
      },
      select: {
        ImageData: true,
      },
    });

    alarmList.push({
      image: userImage?.ImageData,
      nickname: opponentProfile.User.Name,
      guestId: alarm.Opponent_id,
      postingId: alarm.Posting_id,
      postingTitle: postingName,
      isApply: alarm.IsApply,
      createdAt: alarm.createdAt,
    });
  }
  return alarmList;
}

async function checkGuestSignUp(roomId: number) {
  const postingId = (
    await prisma.chatRoom.findFirstOrThrow({
      where: {
        Room_id: roomId,
      },
      select: {
        Posting_id: true,
      },
    })
  ).Posting_id;
  const hostId = (
    await prisma.chatRoom.findFirstOrThrow({
      where: {
        AND: [{ Room_id: roomId }, { IsHost: true }],
      },
      select: {
        User_id: true,
      },
    })
  ).User_id;
  const guestId = (
    await prisma.chatRoom.findFirstOrThrow({
      where: {
        AND: [{ Room_id: roomId }, { IsHost: false }],
      },
      select: {
        User_id: true,
      },
    })
  ).User_id;

  const isSignUp = await prisma.matchAlarm.findFirst({
    where: {
      AND: [
        { Posting_id: postingId },
        { User_id: hostId },
        { Opponent_id: guestId },
      ],
    },
    select: {
      id: true,
    },
  });

  if (isSignUp) return true;
  else return false;
}

async function signUpMatch(postingId: number, roomId: number) {
  const hostId = (
    await prisma.chatRoom.findFirstOrThrow({
      where: {
        AND: [{ Room_id: roomId }, { IsHost: true }],
      },
      select: {
        User_id: true,
      },
    })
  ).User_id;
  const guestId = (
    await prisma.chatRoom.findFirstOrThrow({
      where: {
        AND: [{ Room_id: roomId }, { IsHost: false }],
      },
      select: {
        User_id: true,
      },
    })
  ).User_id;
  await prisma.matchAlarm.create({
    data: {
      Posting_id: postingId,
      User_id: hostId,
      Opponent_id: guestId,
    },
  });
  const postTitle = (
    await prisma.posting.findFirstOrThrow({
      where: {
        Posting_id: postingId,
      },
      select: {
        Title: true,
      },
    })
  ).Title;
  const guestName = (
    await prisma.user.findFirstOrThrow({
      where: { User_id: guestId },
      select: { Name: true },
    })
  ).Name;
  const hostToken = await getToken(String(hostId));
  expo.sendPushNotificationsAsync([
    {
      to: hostToken,
      title: postTitle,
      body: `${guestName}님에게 매칭 참여 요청이 왔습니다.`,
      data: {
        type: "matchParticipate",
      },
    },
  ]);
}

async function checkHostApplyMatch(roomId: number) {
  const postingId = (
    await prisma.chatRoom.findFirstOrThrow({
      where: {
        Room_id: roomId,
      },
      select: {
        Posting_id: true,
      },
    })
  ).Posting_id;
  const hostId = (
    await prisma.chatRoom.findFirstOrThrow({
      where: {
        AND: [{ Room_id: roomId }, { IsHost: true }],
      },
      select: {
        User_id: true,
      },
    })
  ).User_id;
  const guestId = (
    await prisma.chatRoom.findFirstOrThrow({
      where: {
        AND: [{ Room_id: roomId }, { IsHost: false }],
      },
      select: {
        User_id: true,
      },
    })
  ).User_id;
  const isNotificationExist = await prisma.matchAlarm.findFirst({
    where: {
      AND: [
        { Posting_id: postingId },
        { User_id: hostId },
        { Opponent_id: guestId },
      ],
    },
    select: {
      IsApply: true,
    },
  });
  if (!isNotificationExist) return 0;
  if (isNotificationExist.IsApply == null) return 1;
  if (isNotificationExist.IsApply) return 2;
  if (isNotificationExist.IsApply) return 3;
}

export { getPostingAlarm, signUpMatch, checkGuestSignUp, checkHostApplyMatch };
