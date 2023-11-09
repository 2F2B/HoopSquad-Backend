import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ParsedQs } from "qs";
import { LatLngToAddress } from "../google-maps/googleMaps";

const prisma = new PrismaClient();

async function AllMatch(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  const match = await prisma.posting.findMany({
    select: {
      Title: true,
      WriteDate: true,
      Location: true,
      RecruitAmount: true,
      CurrentAmount: true,
    },
  });
  console.log(match);
}

async function AddMatch(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  const Location = await LatLngToAddress(request.body.Lat, request.body.Lng);
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

  if (!user) {
    return { result: "expired" };
  }

  const req = request.body.data;
  await prisma.map.create({
    data: {
      LocationName: req.LocationName as string,
      Lat: req.Lat as number,
      Lng: req.Lng as number,
      Posting: {
        create: {
          User_id: user.User.User_id,
          IsTeam: req.IsTeam,
          Title: req.Title.toString(),
          WriteDate: Date.now().toString(),
          PlayTime: req.PlayTime,
          Location: Location.result[0],
          RecruitAmount: req.RecruitAmount,
          CurrentAmount: req.CurrentAmount,
          Introduce: req.Introduce,
        },
      },
    },
  });
  return {
    TimeStamp: Date.now().toString(),
  };
}

async function MatchInfo(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  const match = await prisma.posting.findFirst({
    where: {
      Posting_id: request.body.id,
    },
  });
  return match;
}

async function MatchFilter(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  if (request.body.Location) {
    const location = request.body.Location;
    const res = await prisma.posting.findFirst({
      where: {
        Location: location,
      },
    });
    return res;
  } else if (request.body.Search) {
    const search = request.body.Search;
    const res = await prisma.posting.findFirst({
      where: {
        Title: {
          contains: search,
        },
      },
    });
    return res;
  } else return { result: "error" };
}

export { AllMatch, AddMatch, MatchFilter, MatchInfo };
