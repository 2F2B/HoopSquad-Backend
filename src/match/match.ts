import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ParsedQs } from "qs";
import { LatLngToAddress } from "../google-maps/googleMaps";

//TODO: 사진 코드, AllMatch에 주소 필터링 마무리

const prisma = new PrismaClient();

async function AllMatch( // 게시글 전체 조회
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  const match = await prisma.posting.findMany({
    where: {
      Location: {
        contains: request.body.Location,
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
      Image: {
        select: {
          ImageData: true,
        },
      },
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

  const Posting = await prisma.posting.findFirst({
    where: {
      Map_id: newMap.Map_id,
    },
  });

  if (req.Image) {
    // 이미지가 존재하면 Image 추가 후 반환
    const image = await prisma.image.create({
      data: {
        ImageData: req.Image,
      },
    });
    const newPosting = { ...Posting, Image_id: image.Image_id };
    return {
      TimeStamp: Date.now().toString(),
      Posting_id: newPosting?.Posting_id,
    };
  }

  return {
    TimeStamp: Date.now().toString(),
    Posting_id: Posting?.Posting_id,
  };
}

async function MatchInfo(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
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
  const match = await prisma.map.findFirst({
    where: {
      Map_id: map.Map_id,
    },
    select: {
      LocationName: true,
      Lat: true,
      Lng: true,
      Posting: true,
    },
  });
  if (!match) {
    return { result: "expired" };
  }
  if (match.Posting[0].Image_id) {
    // 이미지가 있을 시
    const image = await prisma.image.findFirst({
      // 이미지 불러오기
      where: { Image_id: match.Posting[0].Image_id },
    });
    const updatedPosting = match.Posting.map((posting) => {
      // 문자열 -> 숫자 배열로 변환한 뒤 match의 GameTyp을 숫자 배열로 변경
      const gameTypeArray = posting.GameType.split(",").map(Number);
      return {
        ...posting,
        GameType: gameTypeArray,
        Image: image,
      };
    });
    console.log(updatedPosting);
    const updatedMatch = { ...match, Posting: updatedPosting[0] };
    return updatedMatch;
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
  const updatedMatch = { ...match, Posting: updatedPosting[0] };
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
