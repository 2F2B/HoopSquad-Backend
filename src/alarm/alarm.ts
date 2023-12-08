import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 특정 사용자의 모든 알림을 반환하는 함수
 * @param userId
 * @returns
 */
async function getPostingAlarm(userId: number) {
  const alarms = await prisma.matchAlarm.findMany({
    where: {
      User_id: userId,
    },
    select: {
      IsRead: true,
      IsApply: true,
      Opponent_id: true,
      Posting_id: true,
    },
  });

  const alarmList: {
    image: string | undefined;
    nickname: string;
    userId: number;
    postingId: number;
    isRead: boolean;
    isApply: boolean | null;
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
      userId: alarm.Opponent_id,
      postingId: alarm.Posting_id,
      isRead: alarm.IsRead,
      isApply: alarm.IsApply,
    });
  }
  return alarmList;
}

/**
 * 매치 수락/취소를 변경해주는 함수
 * @param isApply
 * @param postingId
 */
async function applyMatch(postingId: number, isApply: boolean) {
  await prisma.matchAlarm.updateMany({
    where: {
      Posting_id: postingId,
    },
    data: {
      IsApply: isApply,
    },
  });
}

/**
 * 알림 목록 전체를 읽음 처리하는 함수
 * @param postingIdList
 */
async function updateIsRead(userId: number) {
  await prisma.matchAlarm.updateMany({
    where: {
      User_id: userId,
    },
    data: {
      IsRead: true,
    },
  });
}

async function deleteAllNotification(userId: number) {
  await prisma.matchAlarm.deleteMany({
    where: {
      User_id: userId,
    },
  });
}

async function deleteNotification(userId: number, postingId: number) {
  await prisma.matchAlarm.deleteMany({
    where: {
      User_id: userId,
      Posting_id: postingId,
    },
  });
}

async function createNotification(
  postingId: number,
  userId: number,
  opponentId: number,
) {
  await prisma.matchAlarm.create({
    data: {
      Posting_id: postingId,
      User_id: userId,
      Opponent_id: opponentId,
    },
  });
}

export {
  getPostingAlarm,
  applyMatch,
  updateIsRead,
  deleteAllNotification,
  deleteNotification,
  createNotification,
};
