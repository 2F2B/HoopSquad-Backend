import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { Request } from "express";
import { ParsedQs } from "qs";

const prisma = new PrismaClient();

async function getUserProfile(userId: number) {
  const Profile = await prisma.user.findFirst({
    where: {
      User_id: userId,
    },
    select: {
      Name: true,
      Profile: true,
    },
  });
  return { ...Profile?.Profile, Name: Profile?.Name };
}

async function setUserProfile(
  req: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  const isUser = await prisma.oAuthToken.findFirst({
    where: {
      AccessToken: req.body.access_token,
    },
    select: {
      User_id: true,
    },
  });

  if (!isUser) throw new Error("User Not Exists");

  const profile = await prisma.profile.update({
    where: {
      User_id: isUser.User_id,
    },
    data: {
      Height: req.body.Height,
      Age: req.body.Age,
      Position: req.body.Position,
      Grade: req.body.Grade,
      Introduce: req.body.Introduce,
      Location: req.body.Location,
    },
  });
  const type = await prisma.gameType.findFirst({
    where: {
      Profile_id: profile.User_id,
    },
    select: {
      GameType_id: true,
    },
  });
  const updatedType = await prisma.gameType.update({
    where: {
      GameType_id: type?.GameType_id,
    },
    data: {
      OneOnOne: req.body.One,
      ThreeOnThree: req.body.Three,
      FiveOnFive: req.body.Five,
    },
  });
  return { ...profile, GameType: updatedType };
}

export { getUserProfile, setUserProfile };
