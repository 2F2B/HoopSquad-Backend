import { PrismaClient } from "@prisma/client";
import {
  NotAdminError,
  TeamAdminLeaveError,
  TeamNotFoundError,
  UserAlreadyInTeamError,
} from "./error";
import { CreateTeamType } from "../routes/teamRouter";

const prisma = new PrismaClient();

async function getTeam(id?: number) {
  if (!id) {
    const teams = await prisma.teamProfile.findMany({
      select: {
        Team_id: true,
        Name: true,
        TeamImage: true,
        Location: true,
        LatestDate: true,
        UserAmount: true,
      },
    });
    return teams;
  } else {
    const team = await prisma.teamProfile.findFirst({
      where: {
        Team_id: id,
      },
    });

    if (team) {
      return team;
    } else throw new TeamNotFoundError();
  }
}

async function joinTeam(teamId: number, userId: number) {
  const team = await prisma.teamProfile.findFirst({
    where: {
      Team_id: teamId,
    },
  });

  if (!team) throw new TeamNotFoundError();

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

async function createTeam({
  Admin_id,
  Name,
  TeamImage,
  Location,
  Introduce,
}: CreateTeamType) {
  const newTeam = await prisma.teamProfile.create({
    data: {
      Admin_id: Admin_id,
      Name: Name,
      Location: Location,
      Introduce: Introduce,
    },
  });

  await prisma.teamRelay.create({
    data: {
      Team_id: newTeam.Team_id,
      IsAdmin: true,
      User_id: newTeam.Admin_id,
    },
  });
}

async function deleteTeam(Team_id: number, User_id: number) {
  const team = await prisma.teamProfile.findFirst({
    where: {
      Team_id: Team_id,
    },
  });

  if (!team) throw new TeamNotFoundError();
  if (team.Admin_id != User_id) throw new NotAdminError();

  await prisma.teamProfile.delete({
    where: {
      Team_id: Team_id,
    },
  });
}

export { getTeam, joinTeam, leaveTeam, createTeam, deleteTeam };
