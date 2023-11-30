import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { Request } from "express";
import { ParsedQs } from "qs";
import path from "path";
import fs from "fs";

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
  else throw new Error("String Is Not Boolean");
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
          Team_id: true,
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
  if (!Profile) throw new Error("Profile Not Found");
  return { ...Profile, Profile: Profile?.Profile[0], Name: Profile?.Name };
}

async function setUserProfile(
  req: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  const isUser = await prisma.oAuthToken.findFirst({
    where: {
      AccessToken: req.body.access_token,
    },
  });

  if (!isUser) throw new Error("User Not Exists");

  const profile = await prisma.profile.findFirst({
    where: {
      User_id: isUser.User_id,
    },
  });

  const one = isTrue(req.body.One) ? true : false,
    three = isTrue(req.body.Three) ? true : false,
    five = isTrue(req.body.Five) ? true : false;

  const updatedProfile = await prisma.profile.update({
    where: {
      Profile_id: profile?.Profile_id,
    },
    data: {
      Height: parseFloat(req.body.Height),
      Weight: parseInt(req.body.Weight),
      Year: parseInt(req.body.Year),
      Introduce: req.body.Introduce,
      Location: req.body.Location,
    },
  });

  let image = await prisma.image.findFirst({
    where: { Profile_id: profile?.Profile_id },
  });

  if (req.file) {
    if (!image) {
      await prisma.image.create({
        data: {
          Profile: { connect: { Profile_id: profile?.Profile_id } },
          ImageData: "",
        },
      });
    }
    image = await prisma.image.update({
      where: { Image_id: image?.Image_id },
      data: {
        ImageData: req.file.filename,
      },
    });
  }
  const type = await prisma.gameType.findFirst({
    where: {
      Profile_id: profile?.Profile_id,
    },
    select: {
      GameType_id: true,
    },
  });
  if (!type) {
    const updatedType = await prisma.gameType.create({
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
    return { ...updatedProfile, GameType: updatedType, Image: image };
  }
  const updatedType = await prisma.gameType.update({
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
  return { ...updatedProfile, GameType: updatedType, Image: image };
}

export { getUserProfile, setUserProfile };
