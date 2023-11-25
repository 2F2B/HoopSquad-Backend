import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 특정 사용자의 모든 알림을 반환하는 함수
 * @param {number} id
 * @returns
 */
async function getAlarm(id: number) {
  const alarmList = await prisma.alarm.findMany({
    where: {
      User_id: id,
    },
    select: {
      Alarm_id: true,
      UserImage: true,
      Text: true,
      IsRead: true,
      IsApply: true,
    },
  });

  return alarmList;
}

/**
 * 매치 수락/취소를 변경해주는 함수
 * @param body
 */

async function applyMatch(body: { Alarm_id: number; IsApply: number }) {
  await prisma.alarm.update({
    where: {
      Alarm_id: body.Alarm_id,
    },
    data: {
      IsApply: body.IsApply,
    },
  });
  const result = await prisma.alarm.findFirst({
    where: {
      Alarm_id: body.Alarm_id,
    },
  });

  return result;
}
export { getAlarm, applyMatch };
