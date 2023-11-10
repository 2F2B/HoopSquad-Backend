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
      Posting_id: true,
      Title: true,
      WriteDate: true,
      Location: true,
      RecruitAmount: true,
      CurrentAmount: true,
    },
  });
  console.log(match);
  return match;
}

async function AddMatch(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  // console.log(request.body.access_token);
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
  const Location = await LatLngToAddress(req.Lat, req.Lng);

  const newMap = await prisma.map.create({
    data: {
      LocationName: req.LocationName as string,
      Lat: parseFloat(req.Lat),
      Lng: parseFloat(req.Lng),
      Posting: {
        create: {
          User_id: user.User.User_id,
          IsTeam: req.IsTeam,
          Title: req.Title.toString(),
          WriteDate: new Date(),
          PlayTime: req.PlayTime,
          Location: Location.result[0],
          RecruitAmount: req.RecruitAmount,
          CurrentAmount: req.CurrentAmount,
          Introduce: req.Introduce,
        },
      },
    },
  });
  const newPosting = await prisma.posting.findFirst({
    where: {
      Map_id: newMap.Map_id,
    },
  });
  return {
    TimeStamp: Date.now().toString(),
    Posting_id: newPosting?.Posting_id,
  };
}

async function MatchInfo(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  3;
  const match = await prisma.posting.findFirst({
    where: {
      Posting_id: request.body.Posting_id,
    },
  });
  return match;
}

async function MatchFilter(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  if (request.body.Location) {
    const location = request.body.Location;
    const res = await prisma.posting.findMany({
      where: {
        Location: {
          contains: location,
        },
      },
      select: {
        Posting_id: true,
        Title: true,
        WriteDate: true,
        Location: true,
        RecruitAmount: true,
        CurrentAmount: true,
      },
    });
    return res;
  } else if (request.body.Title) {
    const search = request.body.Title;
    const res = await prisma.posting.findMany({
      where: {
        Title: {
          contains: search,
        },
      },
      select: {
        Posting_id: true,
        Title: true,
        WriteDate: true,
        Location: true,
        RecruitAmount: true,
        CurrentAmount: true,
      },
    });
    return res;
  } else return { result: "error" };
}

export { AllMatch, AddMatch, MatchFilter, MatchInfo };
