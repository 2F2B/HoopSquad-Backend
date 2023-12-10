import { PrismaClient } from "@prisma/client";
import {
  NameDuplicateError,
  NotAdminError,
  TeamAdminLeaveError,
  TeamNotFoundError,
  UserAlreadyInTeamError,
} from "./error";
import { CreateTeamType } from "../routes/teamRouter";
import Expo from "expo-server-sdk";
import * as FirebaseService from "../alarm/pushNotification";

const prisma = new PrismaClient();
const expo = new Expo();
export {
  getTeam,
  joinTeam,
  leaveTeam,
  createTeam,
  deleteTeam,
  createTeamMatch,
  enterMatchResult,
  participateTeam,
};

async function getTeam(teamId?: number, location?: string) {
  if (!teamId) {
    const teams = await prisma.teamProfile.findMany({
      where: {
        OR: [
          { Location1: { contains: location } },
          { Location2: { contains: location } },
        ],
      },
      select: {
        Team_id: true,
        Name: true,
        TeamImage: true,
        Location1: true,
        Location2: true,
        LatestDate: true,
        UserAmount: true,
      },
    });
    return teams;
  } else {
    const team = await prisma.teamProfile.findFirst({
      where: {
        Team_id: teamId,
      },
    });

    const { games, win, lose } = await getTeamRecord(team);

    const playerIds = await prisma.teamRelay.findMany({
      where: {
        Team_id: teamId,
      },
    });
    const playerInfos = await Promise.all(
      playerIds.map(async (playerId) => {
        const data = await prisma.user.findFirst({
          where: {
            User_id: playerId.User_id,
          },
          select: {
            Name: true,
            Profile: {
              select: {
                Image: {
                  select: {
                    ImageData: true,
                  },
                },
              },
            },
          },
        });
        return { ...data?.Profile?.Image[0], Name: data?.Name };
      }),
    );

    if (team) {
      return {
        ...team,
        games: games,
        win: win,
        lose: lose,
        playerInfos: playerInfos,
      };
    } else throw new TeamNotFoundError();
  }
}

async function getTeamRecord(
  team: {
    Team_id: number;
    Admin_id: number;
    Name: string;
    Introduce: string | null;
    LatestDate: Date | null;
    UserAmount: number | null;
    Location1: string;
    Location2: string | null;
  } | null,
) {
  const matches = await prisma.teamRecord.findMany({
    where: {
      Team_id: team?.Team_id,
    },
    select: {
      IsWin: true,
    },
  });
  const games = matches.length;
  const win = matches.filter((match) => match.IsWin === true).length;
  const lose =
    matches.length - matches.filter((match) => match.IsWin === true).length;
  return { games, win, lose };
}

async function joinTeam(teamId: number, userId: number, isApply: boolean) {
  const team = await prisma.teamProfile.findFirst({
    where: {
      Team_id: teamId,
    },
  });

  if (!team) throw new TeamNotFoundError();
  if (isApply) {
    const checkUserExist = await prisma.teamRelay.findFirst({
      where: {
        Team_id: teamId,
        User_id: userId,
      },
    });

    if (checkUserExist) throw new UserAlreadyInTeamError();

    await prisma.teamRelay.create({
      data: {
        Team_id: teamId,
        IsAdmin: false,
        User_id: userId,
      },
    });

    const userToken = await FirebaseService.getToken(String(userId));
    expo.sendPushNotificationsAsync([
      {
        to: userToken.token,
        title: team.Name,
        body: "팀 참가 신청이 수락되었습니다!",
        data: {
          type: "teamJoinAccepted",
        },
      },
    ]);
  } else {
    const userToken = await FirebaseService.getToken(String(userId));
    expo.sendPushNotificationsAsync([
      {
        to: userToken.token,
        title: team.Name,
        body: "팀 참가 신청이 거절되었습니다.",
        data: {
          type: "teamJoinRejected",
        },
      },
    ]);
  }

  await prisma.teamJoinApply.updateMany({
    where: {
      AND: [{ User_id: userId, Team_id: teamId }],
    },
    data: {
      IsApply: isApply,
    },
  });
}

async function leaveTeam(teamId: number, userId: number) {
  const team = await prisma.teamProfile.findFirst({
    where: {
      Team_id: teamId,
    },
  });

  if (!team) throw new TeamNotFoundError();

  if (team.Admin_id == userId) throw new TeamAdminLeaveError();

  await prisma.teamRelay.deleteMany({
    where: {
      Team_id: teamId,
      User_id: userId,
    },
  });
}

async function createTeam(
  { Admin_id, Name, Location, Introduce }: CreateTeamType,
  files?: Array<string>,
) {
  await checkNameDuplicate(Name);
  const newTeam = await prisma.teamProfile.create({
    data: {
      Admin_id: +Admin_id,
      Name: Name,
      Location1: Location,
      Introduce: Introduce,
    },
  });
  if (files) {
    files.map(async (file) => {
      await prisma.teamImage.create({
        data: {
          TeamProfile: { connect: { Team_id: newTeam.Team_id } },
          ImageName: file,
        },
      });
    });
  }
  await prisma.teamRelay.create({
    data: {
      Team_id: newTeam.Team_id,
      IsAdmin: true,
      User_id: newTeam.Admin_id,
    },
  });
}

async function checkNameDuplicate(Name: string) {
  const duplication = await prisma.teamProfile.findFirst({
    where: {
      Name: Name,
    },
  });
  if (duplication) {
    throw new NameDuplicateError(Name);
  }
}

async function deleteTeam(teamId: number, userId: number) {
  const team = await prisma.teamProfile.findFirst({
    where: {
      Team_id: teamId,
    },
  });

  if (!team) throw new TeamNotFoundError();
  if (team.Admin_id != userId) throw new NotAdminError();

  await prisma.teamProfile.delete({
    where: {
      Team_id: teamId,
    },
  });
}
/**
 *  @param HostTeam_id
 *  @param GuestTeam_id
 *  @param PlayDate
 */
async function createTeamMatch(
  HostTeam_id: number,
  GuestTeam_id: number,
  PlayDate: string,
) {
  const newMatch = await prisma.teamMatch.create({
    data: {
      PlayDate: PlayDate,
    },
  });
  await makeTeamRecord(HostTeam_id, newMatch.TeamMatch_id, true);
  await makeTeamRecord(GuestTeam_id, newMatch.TeamMatch_id, false);
}

async function makeTeamRecord(
  Team_id: number,
  TeamMatch_id: number,
  IsHost: boolean,
) {
  await prisma.teamRecord.create({
    data: {
      Team: { connect: { Team_id: Team_id } },
      TeamMatch: { connect: { TeamMatch_id: TeamMatch_id } },
      IsHost: IsHost,
    },
  });
}
/**
 *  @param TeamMatch_id
 *  @param HostScore
 *  @param GuestScore
 */
async function enterMatchResult(
  TeamMatch_id: number,
  HostScore: number,
  GuestScore: number,
) {
  const record = await getRecordId(TeamMatch_id);

  const IsHostWin = HostScore > GuestScore ? true : false;

  setTeamRecord(record, HostScore, GuestScore, IsHostWin);
}

function setTeamRecord(
  record: { TeamRecord: { Record_id: number; IsHost: boolean }[] } | null,
  HostScore: number,
  GuestScore: number,
  IsHostWin: boolean,
) {
  record?.TeamRecord.map(async (Record) => {
    await prisma.teamRecord.update({
      where: {
        Record_id: Record.Record_id,
      },
      data: {
        Score: Record.IsHost ? HostScore : GuestScore,
        IsWin: Record.IsHost ? IsHostWin : !IsHostWin,
      },
    });
  });
}

async function getRecordId(TeamMatch_id: number) {
  return await prisma.teamMatch.findFirstOrThrow({
    where: {
      TeamMatch_id: TeamMatch_id,
    },
    select: {
      TeamRecord: {
        select: {
          Record_id: true,
          IsHost: true,
        },
      },
    },
  });
}

async function participateTeam(teamId: number, userId: number) {
  await prisma.teamJoinApply.create({
    data: {
      Team_id: teamId,
      User_id: userId,
    },
  });
  const team = await prisma.teamProfile.findFirstOrThrow({
    where: {
      Team_id: teamId,
    },
    select: {
      Admin_id: true,
      Name: true,
    },
  });

  const adminToken = await FirebaseService.getToken(String(team.Admin_id));

  const userName = (
    await prisma.user.findFirstOrThrow({
      where: {
        User_id: userId,
      },
      select: {
        Name: true,
      },
    })
  ).Name;

  expo.sendPushNotificationsAsync([
    {
      to: adminToken.token,
      title: team.Name,
      body: `${userName}님의 참가 신청이 도착했습니다.`,
      data: {
        type: "teamParticipate",
      },
    },
  ]);
}

async function updateTeamProfile(teamId: number) {
  const team = await prisma.teamProfile.update({
    where: {
      Team_id: teamId,
    },
    data: {},
  });
}
