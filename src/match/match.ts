import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { ParsedQs } from "qs";
import { LatLngToAddress } from "../google-maps/googleMaps";

const prisma = new PrismaClient();

function getCurrentTime() {
  // 현재 날짜와 시간을 포함하는 Date 객체 생성
  const currentDate = new Date("2023-11-11T15:16:00");
  console.log(currentDate.getTime() / 1000);
  return Math.floor(Date.now() / 1000);
}

async function FilterTitle(title: string) {
  return await prisma.posting.findMany({
    where: {
      Title: {
        contains: title,
      },
    },
    orderBy: {
      WriteDate: "asc",
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

async function FilterGameType(title: string) {
  return await prisma.posting.findMany({
    where: {
      Title: {
        contains: title,
      },
    },
    orderBy: {
      WriteDate: "asc",
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
}

async function AllMatch( // 게시글 전체 조회
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  // 정렬: 최신순, 마감순  필터: 제목, 유형, null(지역) sort: "WriteDate PlayTime" / filter: "Title GameType"
  const sort = "Location";
  let filter = "Title";
  let one, three, five;

  switch (request.body.filter) {
    case "Title":
      filter = "Title";
      break;
    case "Location":
      filter = "Location";
      break;
    case request.body.filter.includes(1):
      one = true;
      break;
    case request.body.filter.includes(3):
      three = true;
      break;
    case request.body.filter.includes(5):
      five = true;
      break;
  }

  const newMatch = await prisma.posting.findMany({
    where: {
      [filter]: {
        contains: [filter],
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
  return newMatch;
}

async function AddMatch(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  console.log(request.body);
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
  let one, three, five;
  const type = req.GameType;
  switch (type) {
    case type.includes(1):
      one = true;
      break;
    case type.includes(3):
      three = true;
      break;
    case type.includes(5):
      five = true;
      break;
  }

  const newMap = await prisma.map.create({
    data: {
      LocationName: req.LocationName,
      Lat: parseFloat(req.Lat),
      Lng: parseFloat(req.Lng),
      Posting: {
        create: {
          User_id: user.User_id,
          IsTeam: req.IsTeam,
          Title: req.Title.toString(),
          GameType: {
            create: {
              OneOnOne: one,
              ThreeOnThree: three,
              FiveOnFive: five,
            },
          },
          Image: {
            create: {
              ImageData: request.file?.buffer!!,
            },
          },
          WriteDate: new Date(),
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

  if (request.file) {
    // 이미지가 존재하면 Image 추가 후 반환
    console.log("!23");
    const Image = await prisma.image.create({
      data: {
        ImageData: request.file.buffer,
      },
    });
    await prisma.posting.update({
      where: {
        Posting_id: posting?.Posting_id,
      },
      data: {
        Image_id: Image.Image_id,
      },
    });
    return {
      TimeStamp: Date.now().toString(),
      Posting_id: posting?.Posting_id!!,
    };
  }
  return {
    TimeStamp: Date.now().toString(),
    Posting_id: posting?.Posting_id!!,
  };
}

async function MatchInfo(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  console.log(request);
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
  if (!match) {
    return { result: "expired" };
  }
  return match;
}

async function MatchFilter(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  // if (request.body.Location) {
  //   // 주소로 필터링 하여 반환
  //   const location = request.body.Location;
  //   const res = await prisma.posting.findMany({
  //     where: {
  //       Location: {
  //         contains: location,
  //       },
  //     },
  //     select: {
  //       Posting_id: true,
  //       Title: true,
  //       GameType: true,
  //       WriteDate: true,
  //       Location: true,
  //       RecruitAmount: true,
  //       CurrentAmount: true,
  //     },
  //   });
  //   const updatedMatch = res.map((posting) => {
  //     // 문자열 -> 숫자 배열로 변환한 뒤 match의 GameType을 숫자 배열로 변경
  //     const gameTypeArray = posting.GameType.split(",").map(Number);
  //     return {
  //       ...posting,
  //       GameType: gameTypeArray,
  //     };
  //   });
  //   return updatedMatch;
  // } else if (request.body.Title) {
  //   // 제목으로 필터링
  //   const search = request.body.Title;
  //   const res = await prisma.posting.findMany({
  //     where: {
  //       Title: {
  //         contains: search,
  //       },
  //     },
  //     select: {
  //       Posting_id: true,
  //       Title: true,
  //       GameType: true,
  //       WriteDate: true,
  //       Location: true,
  //       RecruitAmount: true,
  //       CurrentAmount: true,
  //     },
  //   });
  //   const updatedMatch = res.map((posting) => {
  //     // 문자열 -> 숫자 배열로 변환한 뒤 match의 GameType을 숫자 배열로 변경
  //     const gameTypeArray = posting.GameType.split(",").map(Number);
  //     return {
  //       ...posting,
  //       GameType: gameTypeArray,
  //     };
  //   });
  //   return updatedMatch;
  // } else if (request.body.Type) {
  //   // 게임 타입으로 필터링
  //   const gameType = request.body.Type;
  //   const res = await prisma.posting.findMany({
  //     where: {
  //       GameType: { contains: gameType.toString() },
  //     },
  //     select: {
  //       Posting_id: true,
  //       Title: true,
  //       GameType: true,
  //       WriteDate: true,
  //       Location: true,
  //       RecruitAmount: true,
  //       CurrentAmount: true,
  //     },
  //   });
  //   const updatedMatch = res.map((posting) => {
  //     // 문자열 -> 숫자 배열로 변환한 뒤 match의 GameTyp을 숫자 배열로 변경
  //     const gameTypeArray = posting.GameType.split(",").map(Number);
  //     return {
  //       ...posting,
  //       GameType: gameTypeArray,
  //     };
  //   });
  //   return updatedMatch;
  // } else return { result: "error" };
}

// TODO 채팅
export { AllMatch, AddMatch, MatchInfo };
