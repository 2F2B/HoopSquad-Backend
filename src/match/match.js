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
function AllMatch(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const match = yield prisma.posting.findMany({
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
    });
}
exports.AllMatch = AllMatch;
function AddMatch(request) {
    return __awaiter(this, void 0, void 0, function* () {
        // console.log(request.body.access_token);
        const user = yield prisma.oAuthToken.findFirst({
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
                LocationName: req.LocationName,
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
        const match = yield prisma.posting.findFirst({
            where: {
                Posting_id: request.body.Posting_id,
            },
        });
        return match;
    });
}
exports.MatchInfo = MatchInfo;
function MatchFilter(request) {
    return __awaiter(this, void 0, void 0, function* () {
        if (request.body.Location) {
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
                    WriteDate: true,
                    Location: true,
                    RecruitAmount: true,
                    CurrentAmount: true,
                },
            });
            return res;
        }
        else if (request.body.Title) {
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
                    WriteDate: true,
                    Location: true,
                    RecruitAmount: true,
                    CurrentAmount: true,
                },
            });
            return res;
        }
        else
            return { result: "error" };
    });
}
exports.MatchFilter = MatchFilter;
