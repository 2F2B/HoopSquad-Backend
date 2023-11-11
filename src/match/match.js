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
exports.MatchInfo = exports.MatchFilter = exports.AddMatch = exports.AllMatch = void 0;
const client_1 = require("@prisma/client");
const googleMaps_1 = require("../google-maps/googleMaps");
const prisma = new client_1.PrismaClient();
function AllMatch(// 게시글 전체 조회
request) {
    return __awaiter(this, void 0, void 0, function* () {
        const match = yield prisma.posting.findMany({
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
            return Object.assign(Object.assign({}, posting), { GameType: gameTypeArray });
        });
        return updatedMatch;
    });
}
exports.AllMatch = AllMatch;
function AddMatch(request) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log(request.body.access_token);
        const user = yield prisma.oAuthToken.findFirst({
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
        const Location = yield (0, googleMaps_1.LatLngToAddress)(req.Lat, req.Lng);
        const newMap = yield prisma.map.create({
            data: {
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
        const newPosting = yield prisma.posting.findFirst({
            where: {
                Map_id: newMap.Map_id,
            },
        });
        return {
            TimeStamp: Date.now().toString(),
            Posting_id: newPosting === null || newPosting === void 0 ? void 0 : newPosting.Posting_id,
        };
    });
}
exports.AddMatch = AddMatch;
function MatchInfo(request) {
    return __awaiter(this, void 0, void 0, function* () {
        3;
        const map = yield prisma.posting.findFirst({
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
        const match = yield prisma.map.findFirst({
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
            return Object.assign(Object.assign({}, posting), { GameType: gameTypeArray });
        });
        console.log(updatedPosting);
        const updatedMatch = Object.assign(Object.assign({}, match), { Posting: updatedPosting });
        return updatedMatch;
    });
}
exports.MatchInfo = MatchInfo;
function MatchFilter(request) {
    return __awaiter(this, void 0, void 0, function* () {
        if (request.body.Location) {
            // 주소로 필터링 하여 반환
            const location = request.body.Location;
            const res = yield prisma.posting.findMany({
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
                return Object.assign(Object.assign({}, posting), { GameType: gameTypeArray });
            });
            return updatedMatch;
        }
        else if (request.body.Title) {
            // 제목으로 필터링
            const search = request.body.Title;
            const res = yield prisma.posting.findMany({
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
                return Object.assign(Object.assign({}, posting), { GameType: gameTypeArray });
            });
            return updatedMatch;
        }
        else if (request.body.Type) {
            // 게임 타입으로 필터링
            const gameType = request.body.Type;
            const res = yield prisma.posting.findMany({
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
                return Object.assign(Object.assign({}, posting), { GameType: gameTypeArray });
            });
            return updatedMatch;
        }
        else
            return { result: "error" };
    });
}
exports.MatchFilter = MatchFilter;
