import { PrismaClient } from "@prisma/client";
import { TeamNotFoundError } from "./error";

type TeamType = {
  Team_id: number;
  Name: string;
  TeamImage: Buffer | null;
  Location: string;
  LatestDate: Date | null;
  UserAmount: number | null;
};

async function getTeam(id?: number) {
  const prisma = new PrismaClient();
  if (!id) {
    const teams = await prisma.teamProfile.findMany();
    const result: TeamType[] = [];

    teams.every((team) => {
      result.push({
        Team_id: team.Team_id,
        Name: team.Name,
        TeamImage: team.TeamImage,
        Location: team.Location,
        LatestDate: team.LatestDate,
        UserAmount: team.UserAmount,
      });
    });

    return result;
  } else {
    //id가 있음
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

export default getTeam;
