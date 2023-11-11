import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ParsedQs } from "qs";
import { LatLngToAddress } from "../google-maps/googleMaps";

const prisma = new PrismaClient();

async function AllMatch( // 게시글 전체 조회
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  const match = await prisma.posting.findMany({
    select: {
      Posting_id: true,
      Title: true,
      GameType: true,
      WriteDate: true,
      Location: true,
      RecruitAmount: true,
      CurrentAmount: true,
    },
  });
  const updatedMatch = match.map((posting) => {
    // 문자열 -> 숫자 배열로 변환한 뒤 match의 GameTyp을 숫자 배열로 변경
    const gameTypeArray = posting.GameType.split(",").map(Number);
    return {
      ...posting,
      GameType: gameTypeArray,
    };
  });
  return updatedMatch;
}

async function AddMatch(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  // console.log(request.body.access_token);
  const user = await prisma.oAuthToken.findFirst({
    // 유저 있는지 확인 및 user_id 가져오기
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
      LocationName: req.LocationName,
      Lat: parseFloat(req.Lat),
      Lng: parseFloat(req.Lng),
      Posting: {
        create: {
          User_id: user.User.User_id,
          IsTeam: req.IsTeam,
          Title: req.Title.toString(),
          GameType: req.Type.toString(),
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
  const map = await prisma.posting.findFirst({
    where: {
      Posting_id: request.body.Posting_id,
    },
    select: {
      Map_id: true,
    },
  });
  if (!map) {
    return { result: "expired" };
  }
  if (map.Map_id === null) {
    return { result: "expired" };
  }
  const match = await prisma.map.findFirst({
    where: {
      Map_id: map.Map_id,
    },
    select: {
      Lat: true,
      Lng: true,
      Posting: true,
    },
  });
  if (!match) {
    return { result: "expired" };
  }
  const updatedPosting = match.Posting.map((posting) => {
    // 문자열 -> 숫자 배열로 변환한 뒤 match의 GameTyp을 숫자 배열로 변경
    const gameTypeArray = posting.GameType.split(",").map(Number);
    return {
      ...posting,
      GameType: gameTypeArray,
    };
  });
  console.log(updatedPosting);
  const updatedMatch = { ...match, Posting: updatedPosting };
  return updatedMatch;
}

async function MatchFilter(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  if (request.body.Location) {
    // 주소로 필터링 하여 반환
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
        GameType: true,
        WriteDate: true,
        Location: true,
        RecruitAmount: true,
        CurrentAmount: true,
      },
    });
    const updatedMatch = res.map((posting) => {
      // 문자열 -> 숫자 배열로 변환한 뒤 match의 GameType을 숫자 배열로 변경
      const gameTypeArray = posting.GameType.split(",").map(Number);
      return {
        ...posting,
        GameType: gameTypeArray,
      };
    });
    return updatedMatch;
  } else if (request.body.Title) {
    // 제목으로 필터링
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
        GameType: true,
        WriteDate: true,
        Location: true,
        RecruitAmount: true,
        CurrentAmount: true,
      },
    });
    const updatedMatch = res.map((posting) => {
      // 문자열 -> 숫자 배열로 변환한 뒤 match의 GameType을 숫자 배열로 변경
      const gameTypeArray = posting.GameType.split(",").map(Number);
      return {
        ...posting,
        GameType: gameTypeArray,
      };
    });
    return updatedMatch;
  } else if (request.body.Type) {
    // 게임 타입으로 필터링
    const gameType = request.body.Type;
    const res = await prisma.posting.findMany({
      where: {
        GameType: { contains: gameType.toString() },
      },
      select: {
        Posting_id: true,
        Title: true,
        GameType: true,
        WriteDate: true,
        Location: true,
        RecruitAmount: true,
        CurrentAmount: true,
      },
    });
    const updatedMatch = res.map((posting) => {
      // 문자열 -> 숫자 배열로 변환한 뒤 match의 GameTyp을 숫자 배열로 변경
      const gameTypeArray = posting.GameType.split(",").map(Number);
      return {
        ...posting,
        GameType: gameTypeArray,
      };
    });
    return updatedMatch;
  } else return { result: "error" };
}

// TODO 채팅
export { AllMatch, AddMatch, MatchFilter, MatchInfo };
