import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ParsedQs } from "qs";
import { LatLngToAddress } from "../google-maps/googleMaps";
import {
  SortNotFoundError,
  GameTypeNotFoundError,
  Posting_idNotFoundError,
  UserNotFoundError,
  PostingNotFoundError,
  UserNotWriterError,
} from "./error";
import multer from "multer";
import fs from "fs";
import path from "path";

const parentDirectory = path.join(__dirname, "../../..");
const uploadsDirectory = path.join(parentDirectory, "uploads");
fs.readdir(uploadsDirectory, (error) => {
  if (error) {
    fs.mkdirSync(uploadsDirectory);
  }
});

const KR_TIME_DIFF = 10 * 9 * 60 * 60 * 1000;

const prisma = new PrismaClient();

function getCurrentTime() {
  // 현재 날짜와 시간을 포함하는 Date 객체 생성
  const currentDate = new Date("2023-11-11T15:16:00");
  return Math.floor(Date.now() / 1000);
}

function isTrue(Type: string | ParsedQs | string[] | ParsedQs[] | undefined) {
  // true, false string을 boolean으로 변환
  if (Type === "true") return true;
  else if (Type === "false") return false;
  else throw new Error("String Is Not Boolean");
}

async function SearchMatchByTitleAndLocation(
  filter: string,
  sort: string,
  input: any,
) {
  // 제목, 주소 기반 검색
  return await prisma.posting.findMany({
    where: {
      [filter]: {
        contains: input ? input : "",
      },
    },
    orderBy: {
      [sort]: "asc",
    },
    select: {
      Posting_id: true,
      Title: true,
      WriteDate: true,
      PlayTime: true,
      Location: true,
      RecruitAmount: true,
      CurrentAmount: true,
      GameType: {
        select: {
          OneOnOne: true,
          ThreeOnThree: true,
          FiveOnFive: true,
        },
      },
      Image: {
        select: {
          ImageData: true,
        },
      },
    },
  });
}

async function SearchMatchByType(typePostingId: number[], sort: string) {
  // 게임 유형에 따라 검사
  return await prisma.posting.findMany({
    where: {
      Posting_id: {
        in: typePostingId,
      },
    },
    orderBy: {
      [sort]: "asc",
    },
    select: {
      Posting_id: true,
      Title: true,
      WriteDate: true,
      PlayTime: true,
      Location: true,
      RecruitAmount: true,
      CurrentAmount: true,
      GameType: {
        select: {
          OneOnOne: true,
          ThreeOnThree: true,
          FiveOnFive: true,
        },
      },
      Image: {
        select: {
          ImageData: true,
        },
      },
      Map: {
        select: {
          LocationName: true,
          Lat: true,
          Lng: true,
        },
      },
    },
  });
}

async function AllMatch( // 게시글 전체 조회
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  // 정렬: 최신순, 마감순  필터: 제목, 유형, 지역    sort: "WriteDate PlayTime" / filter: "Title GameType Location"
  const sort = request.query.Sort?.toString();
  const input = request.query.Input;
  let filter;
  let one, three, five;
  if (!sort) throw new SortNotFoundError(); //  정렬 정보 없을때

  switch (request.query.Filter) {
    case "Title":
      filter = "Title";
      return SearchMatchByTitleAndLocation(filter, sort, input);
    case "Location":
      filter = "Location";
      return SearchMatchByTitleAndLocation(filter, sort, input);
    case "GameType":
      (await isTrue(request.query?.One)) ? (one = true) : (one = null);
      (await isTrue(request.query?.Three)) ? (three = true) : (three = null);
      (await isTrue(request.query?.Five)) ? (five = true) : (five = null);

      const typePostingId = await prisma.gameType.findMany({
        // 검색 조건에 맞는 GameType 테이블을 먼저 검색
        where: {
          OneOnOne: one ? true : undefined,
          ThreeOnThree: three ? true : undefined,
          FiveOnFive: five ? true : undefined,
        },
        select: {
          Posting_id: true,
        },
      });
      if (!typePostingId) throw new GameTypeNotFoundError();
      const postingIds: number[] = typePostingId.map((item) =>
        item.Posting_id
          ? item.Posting_id
          : (() => {
              throw new Posting_idNotFoundError();
            })(),
      );
      return await SearchMatchByType(postingIds, sort);
  }
}

async function AddMatch(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  const user = await prisma.oAuthToken.findFirst({
    // 유저 있는지 확인 및 user_id 가져오기
    where: {
      AccessToken: request.body.access_token,
    },
    select: {
      User_id: true,
    },
  });

  if (!user) throw new UserNotFoundError();

  const req = request.body.data;
  const Location = await LatLngToAddress(req.Lat, req.Lng);
  const playTime = new Date(req.PlayTime).getTime();

  const one = isTrue(req.One) ? true : false,
    three = isTrue(req.Three) ? true : false,
    five = isTrue(req.Five) ? true : false,
    isTeam = isTrue(req.IsTeam) ? true : false;
  const utc = new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000;

  const Time = new Date(utc + KR_TIME_DIFF);
  const newMap = await prisma.map.create({
    data: {
      LocationName: req.LocationName,
      Lat: parseFloat(req.Lat),
      Lng: parseFloat(req.Lng),
      Posting: {
        create: {
          User: { connect: { User_id: user.User_id } },
          IsTeam: isTeam,
          Title: req.Title.toString(),
          GameType: {
            create: {
              OneOnOne: one,
              ThreeOnThree: three,
              FiveOnFive: five,
            },
          },
          WriteDate: Time.toISOString(),
          PlayTime: playTime / 1000,
          Location: Location.result[0],
          RecruitAmount: req.RecruitAmount,
          CurrentAmount: req.CurrentAmount,
          Introduce: req.Introduce,
        },
      },
    },
  });

  const posting = await prisma.posting.findFirst({
    where: {
      Map_id: newMap.Map_id,
    },
  });

  const files = request.files as Array<Express.Multer.File>;
  files.map(async (file: any) => {
    await prisma.image.create({
      data: {
        Posting: { connect: { Posting_id: posting?.Posting_id } },
        ImageData: file.filename,
      },
    });
  });

  return {
    TimeStamp: Date.now().toString(),
    Posting_id: posting?.Posting_id!!,
  };
}

async function MatchInfo(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  if (!request.query.Posting_id) throw new Posting_idNotFoundError();
  const map = await prisma.posting.findFirst({
    where: {
      Posting_id: parseInt(request.query?.Posting_id.toString()),
    },
    select: {
      Map_id: true,
    },
  });
  if (!map) throw new PostingNotFoundError();
  const match = await prisma.map.findFirst({
    where: {
      Map_id: map.Map_id,
    },
    select: {
      LocationName: true,
      Lat: true,
      Lng: true,
      Posting: {
        select: {
          Posting_id: true,
          User_id: true,
          IsTeam: true,
          Title: true,
          WriteDate: true,
          PlayTime: true,
          Location: true,
          RecruitAmount: true,
          CurrentAmount: true,
          Introduce: true,
          GameType: true,
          Image: true,
        },
      },
    },
  });
  if (!match) throw new PostingNotFoundError();
  return match;
}

async function DeleteMatch(Posting_id: number, access_token: any) {
  // 게시글 삭제
  const user = await prisma.oAuthToken.findFirst({
    where: {
      AccessToken: access_token,
    },
    select: { User_id: true },
  });
  if (!user) throw new UserNotFoundError();

  const posting = await prisma.posting.findFirst({
    where: {
      Posting_id: Posting_id,
    },
    select: { Posting_id: true, User_id: true },
  });
  if (user.User_id === posting?.User_id) {
    await prisma.posting.delete({
      where: { Posting_id: posting.Posting_id },
    });
  } else throw new UserNotWriterError();
}

// TODO 채팅
export { AllMatch, AddMatch, MatchInfo, DeleteMatch };
