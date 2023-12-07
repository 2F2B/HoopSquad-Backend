import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ParsedQs } from "qs";
import { LatLngToAddress, AddressToLatLng } from "../google-maps/googleMaps";
import {
  NotFoundError,
  UserNotWriterError,
  TypeNotBooleanError,
  MatchJoinError,
  UserAlreadyJoinError,
} from "./error";
import multer from "multer";
import fs from "fs";
import path from "path";

const parentDirectory = path.join(__dirname, "../../..");
const uploadsDirectory = path.join(parentDirectory, "image/match");
fs.readdir(uploadsDirectory, (error) => {
  // 디렉토리를 읽어서 해당하는 디렉토리가 없으면 해당 디렉토리를 생성
  if (error) {
    fs.mkdirSync(uploadsDirectory);
  }
});

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
  else throw new TypeNotBooleanError();
}

async function SearchMatchByTitle(
  filter: string,
  location: string,
  sort: string,
  input: any,
) {
  // 제목, 주소 기반 검색
  return await prisma.posting.findMany({
    where: {
      Location: { contains: location },
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

async function SearchMatchByType(
  typePostingId: number[],
  sort: string,
  location: string,
) {
  // 게임 유형에 따라 검사
  return await prisma.posting.findMany({
    where: {
      Location: { contains: location },
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
  const location = request.query.Location?.toString();
  let one, three, five;
  if (!location) throw new NotFoundError("Location");
  if (!sort) throw new NotFoundError("Sort"); //  정렬 정보 없을때

  switch (request.query.Filter) {
    case "Title":
      return SearchMatchByTitle("Title", location, sort, input);
    case "GameType":
      (await isTrue(request.query?.One)) ? (one = true) : (one = false);
      (await isTrue(request.query?.Three)) ? (three = true) : (three = false);
      (await isTrue(request.query?.Five)) ? (five = true) : (five = false);

      const typePostingId = await prisma.gameType.findMany({
        // 검색 조건에 맞는 GameType 테이블을 먼저 검색
        where: {
          Posting_id: { not: null },
          ...(one ? { OneOnOne: true } : {}),
          ...(three ? { ThreeOnThree: true } : {}),
          ...(five ? { FiveOnFive: true } : {}),
        },
        select: {
          Posting_id: true,
        },
      });
      if (!typePostingId) throw new NotFoundError("GameType");
      const postingIds: number[] = typePostingId.map((item) =>
        item.Posting_id
          ? item.Posting_id
          : (() => {
              throw new NotFoundError("Posting_id");
            })(),
      );
      return await SearchMatchByType(postingIds, sort, location);
  }
}

async function AddMatch(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
  AccessToken: any,
) {
  const user = await prisma.oAuthToken.findFirst({
    // 유저 있는지 확인 및 user_id 가져오기
    where: {
      AccessToken: AccessToken,
    },
    select: {
      User_id: true,
    },
  });

  if (!user) throw new NotFoundError("User");

  const req = request.body.data;
  const Location = await AddressToLatLng(req.Address);
  const playTime = new Date(req.PlayTime).getTime();

  const one = isTrue(req.One) ? true : false,
    three = isTrue(req.Three) ? true : false,
    five = isTrue(req.Five) ? true : false,
    isTeam = isTrue(req.IsTeam) ? true : false;
  // const Time = getISOTime();
  const newMap = await prisma.map.create({
    data: {
      LocationName: req.LocationName,
      Lat: Location.lat,
      Lng: Location.lng,
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
          PlayTime: playTime / 1000,
          Location: req.Address,
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

  await prisma.member.create({
    data: {
      User: { connect: { User_id: user.User_id } },
      Posting: { connect: { Posting_id: posting?.Posting_id } },
      IsHost: true,
    },
  });

  const files = request.files as Array<Express.Multer.File>;
  if (files) {
    files.map(async (file: any) => {
      // 이미지 테이블에는 이미지 제목을 저장
      await prisma.image.create({
        data: {
          Posting: { connect: { Posting_id: posting?.Posting_id } },
          ImageData: file.filename,
        },
      });
    });
  }

  return {
    TimeStamp: Date.now().toString(),
    Posting_id: posting?.Posting_id!!,
  };
}

// export function getISOTime() {
//   const utc = new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000;

//   const Time = new Date(utc);
//   return Time.toISOString();
// }

async function MatchInfo(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  if (!request.query.Posting_id) throw new NotFoundError("Posting_id");
  const map = await prisma.posting.findFirst({
    where: {
      Posting_id: parseInt(request.query?.Posting_id.toString()),
    },
    select: {
      Map_id: true,
    },
  });
  if (!map) throw new NotFoundError("Posting");
  const match = await prisma.map.findFirstOrThrow({
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
      },
    },
  });
  const writerImage = await getWriterImage(match);
  const result = {
    ...match.Posting[0],
    LocationName: match.LocationName,
    Lat: match.Lat,
    Lng: match.Lng,
    GameType: match.Posting[0].GameType,
    Image: match.Posting[0].Image,
    WriterImage: writerImage.Profile[0].Image[0],
  };
  if (!match) throw new NotFoundError("Posting");
  return result;
}

async function getWriterImage(match: {
  LocationName: string;
  Lat: number;
  Lng: number;
  Posting: {
    Posting_id: number;
    User_id: number;
    IsTeam: boolean;
    Title: string;
    WriteDate: Date;
    PlayTime: number;
    Location: string;
    RecruitAmount: string;
    CurrentAmount: string;
    Introduce: string | null;
    GameType: {
      OneOnOne: boolean;
      ThreeOnThree: boolean;
      FiveOnFive: boolean;
    }[];
    Image: {
      ImageData: string;
    }[];
  }[];
}) {
  return await prisma.user.findFirstOrThrow({
    where: {
      User_id: match.Posting[0].User_id,
    },
    select: {
      Profile: {
        select: {
          Image: {
            select: {
              ImageData: true,
            },
          },
        },
      },
    },
  });
}

async function DeleteMatch(Posting_id: number, access_token: any) {
  // 게시글 삭제
  const user = await prisma.oAuthToken.findFirst({
    where: {
      AccessToken: access_token,
    },
    select: { User_id: true },
  });
  if (!user) throw new NotFoundError("User");

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
    const images = await prisma.image.findMany({
      where: {
        Posting_id: posting.Posting_id,
      },
    });
    if (images) {
      images.forEach((file: any) => {
        const filePath = path.join(uploadsDirectory, file.ImageData);
        fs.unlink(filePath, (unlinkErr: any) => {});
      });
    }
  } else throw new UserNotWriterError();
}

async function JoinMatch(Posting_id: number, User_id: number) {
  const isJoining = await prisma.member.findFirst({
    where: {
      User_id: User_id,
    },
  });
  if (!isJoining) {
    await prisma.member.create({
      data: {
        Posting: { connect: { Posting_id: Posting_id } },
        User: { connect: { User_id: User_id } },
      },
    });
  } else throw new UserAlreadyJoinError();
}

// TODO 채팅
export { AllMatch, AddMatch, MatchInfo, DeleteMatch, JoinMatch };
