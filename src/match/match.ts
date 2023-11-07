import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ParsedQs } from "qs";

const prisma = new PrismaClient();

async function AllMatch(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  const match = await prisma.posting.findMany();
  console.log(match);
}

async function AddMatch(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  const user = await prisma.oAuthToken.findFirst({
    where: {
      AccessToken: request.body.access_token,
    },
    select: {
      User: {
        select: {
          User_id: true,
        },
      },
    },
  });

  if (user?.User.User_id.valueOf undefined) {
    return { result: "expired" };
  }

  const req = request.body.data;
  await prisma.posting.create({
    data: {
      User_id: user?.User.User_id,
      IsTeam: req.isTeam.parseInt(),
      Title: req.Title,
      WriteDate: Date.now().toString(),
      PlayTime: req.PlayTime,
      Location: req.Location,
      RecruitAmount: req.RecruitAmount,
      CurrentAmount: req.CurrentAmount,
      Map: {
        create: {
          LocationName: req.Title,
          Lat: req.lat,
          Lng: req.Lng,
        },
      },
    },
  });
}

export { AllMatch, AddMatch };
