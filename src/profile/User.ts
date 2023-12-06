import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { Request } from "express";
import { ParsedQs } from "qs";
import path from "path";
import fs from "fs";
import { NotFoundError, TypeNotBooleanError } from "./error";
import sanitize from "sanitize-filename";

const parentDirectory = path.join(__dirname, "../../..");
const uploadsDirectory = path.join(parentDirectory, "image/user");
fs.readdir(uploadsDirectory, (error) => {
  // 디렉토리를 읽어서 해당하는 디렉토리가 없으면 해당 디렉토리를 생성
  if (error) {
    fs.mkdirSync(uploadsDirectory);
  }
});
const prisma = new PrismaClient();

function isTrue(Type: string | ParsedQs | string[] | ParsedQs[] | undefined) {
  // true, false string을 boolean으로 변환
  if (Type === "true") return true;
  else if (Type === "false") return false;
  else throw new TypeNotBooleanError();
}

async function getUserProfile(userId: number) {
  const Profile = await prisma.user.findFirst({
    where: {
      User_id: userId,
    },
    select: {
      Name: true,
      Profile: {
        select: {
          User_id: true,
          Height: true,
          Introduce: true,
          Location: true,
          Overall: true,
          Weight: true,
          Year: true,
          GameType: {
            select: {
              OneOnOne: true,
              ThreeOnThree: true,
              FiveOnFive: true,
            },
          },
          Image: true,
        },
      },
    },
  });

  const sortedTeam = await getUserTeams(userId);

  if (!Profile) throw new NotFoundError("Profile");
  return {
    ...Profile.Profile[0],
    GameType: Profile.Profile[0].GameType[0],
    Image: Profile.Profile[0].Image[0],
    Name: Profile?.Name,
    Team: sortedTeam,
  };
}

async function getUserTeams(userId: number) {
  const teams = await prisma.teamRelay.findMany({
    where: {
      User_id: userId,
    },
    select: {
      TeamProfile: {
        select: {
          Name: true,
          TeamImage: true,
          Introduce: true,
        },
      },
    },
  });
  const sortedTeam = await Promise.all(
    teams.map(async (team) => {
      return {
        Name: team.TeamProfile.Name,
        TeamImage: team.TeamProfile.TeamImage,
        Introduce: team.TeamProfile.Introduce,
      };
    }),
  );
  return sortedTeam;
}

async function getUserTeams(userId: number) {
  const teams = await prisma.teamRelay.findMany({
    where: {
      User_id: userId,
    },
    select: {
      TeamProfile: {
        select: {
          Team_id: true,
          Name: true,
          TeamImage: true,
          Introduce: true,
        },
      },
    },
  });
  const sortedTeam = await Promise.all(
    teams.map(async (team) => {
      return {
        TeamId: team.TeamProfile.Team_id,
        Name: team.TeamProfile.Name,
        TeamImage: team.TeamProfile.TeamImage,
        Introduce: team.TeamProfile.Introduce,
      };
    }),
  );
  return sortedTeam;
}
async function setUserProfile(
  req: Request<{}, any, any, ParsedQs, Record<string, any>>,
  AccessToken: string,
) {
  const isUser = await validateUser(AccessToken);
  const { profile, updatedProfile } = await updateProfile(isUser, req);
  let image = await createOrUpdateUserImage(profile, req);

  const one = isTrue(req.body.One) ? true : false,
    three = isTrue(req.body.Three) ? true : false,
    five = isTrue(req.body.Five) ? true : false;

  const type = await prisma.gameType.findFirst({
    where: {
      Profile_id: profile?.Profile_id,
    },
    select: {
      GameType_id: true,
    },
  });
  let updatedType: {
    OneOnOne: boolean;
    ThreeOnThree: boolean;
    FiveOnFive: boolean;
  };
  if (!type) {
    updatedType = await createGameType(profile, one, three, five);
  } else {
    updatedType = await updateGameType(type, one, three, five);
  }
  return { ...updatedProfile, GameType: updatedType, Image: image };
}

async function updateGameType(
  type: { GameType_id: number },
  one: boolean,
  three: boolean,
  five: boolean,
) {
  return await prisma.gameType.update({
    where: {
      GameType_id: type?.GameType_id,
    },
    data: {
      OneOnOne: one,
      ThreeOnThree: three,
      FiveOnFive: five,
    },
    select: {
      OneOnOne: true,
      ThreeOnThree: true,
      FiveOnFive: true,
    },
  });
}

async function createGameType(
  profile: {
    User_id: number;
    Height: number | null;
    Introduce: string | null;
    Location: string | null;
    Overall: number;
    Team_id: number | null;
    Weight: number | null;
    Year: number | null;
    Profile_id: number;
  } | null,
  one: boolean,
  three: boolean,
  five: boolean,
) {
  return await prisma.gameType.create({
    data: {
      Profile: { connect: { Profile_id: profile?.Profile_id } },
      OneOnOne: one,
      ThreeOnThree: three,
      FiveOnFive: five,
    },
    select: {
      OneOnOne: true,
      ThreeOnThree: true,
      FiveOnFive: true,
    },
  });
}

async function createOrUpdateUserImage(
  profile: {
    User_id: number;
    Height: number | null;
    Introduce: string | null;
    Location: string | null;
    Overall: number;
    Team_id: number | null;
    Weight: number | null;
    Year: number | null;
    Profile_id: number;
  } | null,
  req: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  let image = await prisma.image.findFirst({
    where: { Profile_id: profile?.Profile_id },
  });

  if (req.file) {
    const fileName = sanitize(req.file.filename);
    if (!image) {
      image = await prisma.image.create({
        data: {
          Profile: { connect: { Profile_id: profile?.Profile_id } },
          ImageData: fileName,
        },
      });
    } else {
      image = await prisma.image.update({
        where: { Image_id: image.Image_id },
        data: {
          ImageData: fileName,
        },
      });
    }
  }
  return image;
}

async function updateProfile(
  isUser: {
    id: number;
    User_id: number;
    AccessToken: string;
    RefreshToken: string;
    AToken_CreatedAt: string;
    RToken_CreatedAt: string;
    AToken_Expires: number;
    RToken_Expires: number;
    Auth_id: string;
  },
  req: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  const profile = await prisma.profile.findFirst({
    where: {
      User_id: isUser.User_id,
    },
  });

  const updatedProfile = await prisma.profile.update({
    where: {
      Profile_id: profile!!.Profile_id,
    },
    data: {
      Height: parseFloat(req.body.Height),
      Weight: parseInt(req.body.Weight),
      Year: parseInt(req.body.Year),
      Introduce: req.body.Introduce,
      Location: req.body.Location,
    },
  });
  return { profile, updatedProfile };
}

async function validateUser(AccessToken: string) {
  const isUser = await prisma.oAuthToken.findFirst({
    where: {
      AccessToken: AccessToken,
    },
  });

  if (!isUser) throw new NotFoundError("User");
  return isUser;
}

async function setOverall(
  AccessToken: any,
  isJoin: boolean,
  isPositive: boolean,
  comment: string,
) {
  const userId = await prisma.oAuthToken.findFirst({
    where: {
      AccessToken: AccessToken,
    },
  });
  if (!userId) throw new NotFoundError("User");

  let score = 0;
  isJoin ? (score += 3) : (score -= 5);
  isPositive ? (score += 5) : (score -= 3);
}

export { getUserProfile, setUserProfile };
