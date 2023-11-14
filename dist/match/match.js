"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
    console.log(currentDate.getTime() / 1000);
    return Math.floor(Date.now() / 1000);
}
function FilterTitle(title) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma.posting.findMany({
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
    });
}
function FilterGameType(title) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma.posting.findMany({
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
    });
}
function AllMatch(// 게시글 전체 조회
request) {
    return __awaiter(this, void 0, void 0, function* () {
        // 정렬: 최신순, 마감순  필터: 제목, 유형, null(지역) sort: "WriteDate PlayTime" / filter: "Title GameType"
        const sort = request.body.sort;
        let filter = [1, 3, 5];
        if (request.body.GameType) {
        }
        else if (request.body.Title) {
        }
        const newMatch = yield prisma.posting.findMany({
            where: {
                Location: {
                    contains: request.body.Location,
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
    });
}
exports.AllMatch = AllMatch;
function AddMatch(request) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(request.body);
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
        const one = isTrue(req.One) ? true : false, three = isTrue(req.Three) ? true : false, five = isTrue(req.Five) ? true : false, isTeam = isTrue(req.IsTeam) ? true : false;
        const utc = new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000;
        const Time = new Date(utc + KR_TIME_DIFF);
        const newMap = yield prisma.map.create({
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
        const posting = yield prisma.posting.findFirst({
            where: {
                Map_id: newMap.Map_id,
            },
        });
        if (request.file) {
            // 이미지가 존재하면 Image 추가 후 반환
            console.log("!23");
            const image = yield prisma.image.create({
                data: {
                    ImageData: request.file.buffer,
                },
            });
            yield prisma.posting.update({
                where: {
                    Posting_id: posting === null || posting === void 0 ? void 0 : posting.Posting_id,
                },
                data: {
                    Image_id: Image.Image_id,
                },
            });
            yield prisma.posting.update({
                where: {
                    Posting_id: posting === null || posting === void 0 ? void 0 : posting.Posting_id,
                },
                data: {
                    Image_id: image.Image_id,
                },
            });
            return {
                TimeStamp: Date.now().toString(),
                Posting_id: posting === null || posting === void 0 ? void 0 : posting.Posting_id,
            };
        }
        return {
            TimeStamp: Date.now().toString(),
            Posting_id: posting === null || posting === void 0 ? void 0 : posting.Posting_id,
        };
    });
}
exports.AddMatch = AddMatch;
function MatchInfo(request) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!request.query.Posting_id)
            throw new Error("Posting_id Not Exists");
        const map = yield prisma.posting.findFirst({
            where: {
                Posting_id: parseInt(request.query.Posting_id.toString()),
            },
            select: {
                Map_id: true,
            },
        });
        if (!map)
            throw new Error("Posting Not Exists");
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
        if (!match) {
            return { result: "expired" };
        }
        return match;
    });
}
exports.MatchInfo = MatchInfo;
function MatchFilter(request) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
//# sourceMappingURL=match.js.map