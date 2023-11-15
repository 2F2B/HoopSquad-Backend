"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchInfo = exports.AddMatch = exports.AllMatch = void 0;
const client_1 = require("@prisma/client");
const googleMaps_1 = require("../google-maps/googleMaps");
const prisma = new client_1.PrismaClient();
function getCurrentTime() {
  // 현재 날짜와 시간을 포함하는 Date 객체 생성
  const currentDate = new Date("2023-11-11T15:16:00");
  return Math.floor(Date.now() / 1000);
}
function isTrue(Type) {
  // true, false string을 boolean으로 변환
  if (Type === "true") return true;
  else if (Type === "false") return false;
  else throw new Error("String Is Not Boolean");
}
function SearchMatchByTitleAndLocation(filter, sort, input) {
  return __awaiter(this, void 0, void 0, function* () {
    // 제목, 주소 기반 검색
    return yield prisma.posting.findMany({
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
  });
}
function SearchMatchByType(typePostingId, sort) {
  return __awaiter(this, void 0, void 0, function* () {
    // 게임 유형에 따라 검사
    return yield prisma.posting.findMany({
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
  });
}
function AllMatch(request) {
  // 게시글 전체 조회
  var _a, _b, _c, _d;
  return __awaiter(this, void 0, void 0, function* () {
    // 정렬: 최신순, 마감순  필터: 제목, 유형, 지역    sort: "WriteDate PlayTime" / filter: "Title GameType Location"
    const sort =
      (_a = request.query.Sort) === null || _a === void 0
        ? void 0
        : _a.toString();
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
        (yield isTrue(
          (_b = request.query) === null || _b === void 0 ? void 0 : _b.One,
        ))
          ? (one = true)
          : (one = null);
        (yield isTrue(
          (_c = request.query) === null || _c === void 0 ? void 0 : _c.Three,
        ))
          ? (three = true)
          : (three = null);
        (yield isTrue(
          (_d = request.query) === null || _d === void 0 ? void 0 : _d.Five,
        ))
          ? (five = true)
          : (five = null);
        const typePostingId = yield prisma.gameType.findMany({
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
        console.log(typePostingId);
        if (!typePostingId) throw new Error("GameType Not Exists");
        const postingIds = typePostingId.map((item) =>
          item.Posting_id
            ? item.Posting_id
            : (() => {
                throw new Error("Posting_id Not Exists");
              })(),
        );
        return yield SearchMatchByType(postingIds, sort);
    }
  });
}
exports.AllMatch = AllMatch;
function AddMatch(request) {
  return __awaiter(this, void 0, void 0, function* () {
    const user = yield prisma.oAuthToken.findFirst({
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
    const Location = yield (0, googleMaps_1.LatLngToAddress)(req.Lat, req.Lng);
    const playTime = new Date(req.PlayTime).getTime();
    const one = isTrue(req.One) ? true : false,
      three = isTrue(req.Three) ? true : false,
      five = isTrue(req.Five) ? true : false,
      isTeam = isTrue(req.IsTeam) ? true : false;
    const utc =
      new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000;
    const Time = new Date(utc + KR_TIME_DIFF);
    const newMap = yield prisma.map.create({
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
    const posting = yield prisma.posting.findFirst({
      where: {
        Map_id: newMap.Map_id,
      },
    });
    return {
      TimeStamp: Date.now().toString(),
      Posting_id:
        posting === null || posting === void 0 ? void 0 : posting.Posting_id,
    };
  });
}
exports.AddMatch = AddMatch;
function MatchInfo(request) {
  return __awaiter(this, void 0, void 0, function* () {
    if (!request.query.Posting_id) throw new Error("Posting_id Not Exists");
    const map = yield prisma.posting.findFirst({
      where: {
        Posting_id: parseInt(request.query.Posting_id.toString()),
      },
      select: {
        Map_id: true,
      },
    });
    if (!map) throw new Error("Posting Not Exists");
    const match = yield prisma.map.findFirst({
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
  });
}
exports.MatchInfo = MatchInfo;
//# sourceMappingURL=match.js.map
