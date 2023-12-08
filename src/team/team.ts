import { PrismaClient } from "@prisma/client";
import {
  NotAdminError,
  TeamAdminLeaveError,
  TeamNotFoundError,
  UserAlreadyInTeamError,
} from "./error";
import path from "path";
import fs from "fs";
import { CreateTeamType } from "../routes/teamRouter";

const prisma = new PrismaClient();

async function getTeam(id?: number, location?: string) {
  if (!id) {
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

async function createTeam(
  { Admin_id, Name, Location, Introduce }: CreateTeamType,
  files?: Array<string>,
) {
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
