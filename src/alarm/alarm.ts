import { PrismaClient } from "@prisma/client";
import Expo from "expo-server-sdk";
import * as FirebaseService from "./pushNotification";
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
      OR: [
        { User_id: userId },
        { AND: [{ Opponent_id: userId }, { NOT: { IsApply: null } }] },
      ],
    },
    select: {
      IsApply: true,
      Opponent_id: true,
      Posting_id: true,
      createdAt: true,
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

/**
 * 매치 수락/취소를 변경 및 게스트에게 푸쉬 알림을 해주는 함수
 * @param isApply
 * @param postingId
 */
async function applyMatch(
  postingId: number,
  guestId: number,
  isApply: boolean,
) {
  await prisma.matchAlarm.updateMany({
    where: {
      AND: [{ Posting_id: postingId }, { User_id: guestId }],
    },
    data: {
      IsApply: isApply,
    },
  });
  const notification = await prisma.matchAlarm.findFirstOrThrow({
    where: {
      Posting_id: postingId,
    },
    select: {
      Opponent_id: true,
    },
  });
  const post = await prisma.posting.findFirstOrThrow({
    where: {
      Posting_id: postingId,
    },
    select: {
      Title: true,
    },
  });

  const opponentToken = await FirebaseService.getToken(
    String(notification.Opponent_id),
  );

  expo.sendPushNotificationsAsync([
    {
      to: opponentToken.token,
      title: `${post?.Title}`,
      body: isApply ? "매칭이 수락되었습니다!" : "매칭이 거절되었습니다.",
      data: {
        type: "match",
      },
    },
  ]);
}

async function createNotification(
  postingId: number,
  hostId: number,
  guestId: number,
) {
  await prisma.matchAlarm.create({
    data: {
      Posting_id: postingId,
      User_id: hostId,
      Opponent_id: guestId,
    },
  });
}

export { getPostingAlarm, applyMatch, createNotification };
