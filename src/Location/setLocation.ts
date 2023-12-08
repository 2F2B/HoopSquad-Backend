import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function SetProfileLocation(Location: string, AccessToken: string) {
  const user = await prisma.oAuthToken.findFirstOrThrow({
    where: {
      AccessToken: AccessToken,
    },
  });

  const profile = await prisma.profile.findFirstOrThrow({
    where: {
      User_id: user.User_id,
    },
  });

  await setUserLocation1OrLocation2(profile, Location);
}

async function SetTeamLocation(TeamId: number, Location: string) {
  const teamLocation = await prisma.teamProfile.findFirstOrThrow({
    where: {
      Team_id: TeamId,
    },
    select: {
      Location1: true,
    },
  });
  await setTeamLocation1OrLocation2(teamLocation, TeamId, Location);
}

export { SetProfileLocation, SetTeamLocation };

async function setTeamLocation1OrLocation2(
  teamLocation: { Location1: string },
  TeamId: number,
  Location: string,
) {
  if (teamLocation)
    await prisma.teamProfile.update({
      where: {
        Team_id: TeamId,
      },
      data: {
        Location2: Location,
      },
    });
  else
    await prisma.teamProfile.update({
      where: {
        Team_id: TeamId,
      },
      data: {
        Location1: Location,
      },
    });
}

async function setUserLocation1OrLocation2(
  profile: {
    User_id: number;
    Height: number | null;
    Introduce: string | null;
    Overall: number;
    Team_id: number | null;
    Weight: number | null;
    Year: number | null;
    Profile_id: number;
    Location1: string | null;
    Location2: string | null;
  },
  Location: string,
) {
  if (!profile?.Location1) {
    await prisma.profile.update({
      where: {
        Profile_id: profile?.Profile_id,
      },
      data: {
        Location1: Location,
      },
    });
  } else {
    await prisma.profile.update({
      where: {
        Profile_id: profile?.Profile_id,
      },
      data: {
        Location2: Location,
      },
    });
  }
}
