import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ParsedQs } from "qs";
import { LatLngToAddress } from "../google-maps/googleMaps";

const KR_TIME_DIFF = 10 * 9 * 60 * 60 * 1000;

const prisma = new PrismaClient();

function getCurrentTime() {
  // 현재 날짜와 시간을 포함하는 Date 객체 생성
  const currentDate = new Date("2023-11-11T15:16:00");
  console.log(currentDate.getTime() / 1000);
  return Math.floor(Date.now() / 1000);
}

function isTrue(Type: string | ParsedQs | string[] | ParsedQs[] | undefined) {
  console.log("1", Type);
  if (Type === "true") return true;
  else if (Type === "false") return false;
  else throw new Error("String Is Not Boolean");
}

async function SearchMatchByTitleAndLocation(
  filter: string,
  sort: string,
  input: any,
) {
  console.log(filter, sort, input);
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
  // 정렬: 최신순, 마감순  필터: 제목, 유형, 지역       sort: "WriteDate PlayTime" / filter: "Title GameType Location"
  const sort = request.query.Sort?.toString();
  const input = request.query.Input;
  let filter;
  let one, three, five;
  if (!sort) throw new Error("Sort Not Exist"); //  정렬 정보 없을때

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
        where: {
          OneOnOne: one ? true : undefined,
          ThreeOnThree: three ? true : undefined,
          FiveOnFive: five ? true : undefined,
        },
        select: {
          Posting_id: true,
        },
      });
      if (!typePostingId) throw new Error("GameType Not Exists");
      const postingIds: number[] = typePostingId.map((item) =>
        item.Posting_id
          ? item.Posting_id
          : (() => {
              throw new Error("Posting_id Not Exists");
            })(),
      );
      return await SearchMatchByType(postingIds, sort);
  }
}

async function AddMatch(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  console.log(request.body);
  console.log(request.file);
  const user = await prisma.oAuthToken.findFirst({
    // 유저 있는지 확인 및 user_id 가져오기
    where: {
      AccessToken: request.body.access_token,
    },
    select: {
      User_id: true,
    },
  });

  if (!user) {
    return { result: "expired" };
  }

  const req = request.body.data;
  const Location = await LatLngToAddress(req.Lat, req.Lng);
  const playTime = new Date(req.PlayTime).getTime();

  let one = isTrue(req.One) ? true : false,
    three = isTrue(req.Three) ? true : false,
    five = isTrue(req.Five) ? true : false;
  let isTeam = isTrue(req.IsTeam) ? true : false;
  const utc = new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000;
  console.log(utc);

  const Time = new Date(utc + KR_TIME_DIFF);
  console.log(new Date(utc));
  console.log(Time);

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
          Image: request.file
            ? {
                create: {
                  ImageData: request.file.buffer,
                },
              }
            : undefined,
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

  return {
    TimeStamp: Date.now().toString(),
    Posting_id: posting?.Posting_id!!,
  };
}

async function MatchInfo(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  if (!request.query.Posting_id) throw new Error("Posting_id Not Exists");
  const map = await prisma.posting.findFirst({
    where: {
      Posting_id: parseInt(request.query.Posting_id.toString()),
    },
    select: {
      Map_id: true,
    },
  });
  if (!map) throw new Error("Posting Not Exists");
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
  if (!match) throw new Error("Posting Not Exists");
  return match;
}

// TODO 채팅
export { AllMatch, AddMatch, MatchInfo };
