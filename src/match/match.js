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
                Title: true,
                WriteDate: true,
                Location: true,
                RecruitAmount: true,
                CurrentAmount: true,
            },
        });
        console.log(match);
    });
}
exports.AllMatch = AllMatch;
function AddMatch(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const Location = yield (0, googleMaps_1.LatLngToAddress)(request.body.Lat, request.body.Lng);
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
        yield prisma.map.create({
            data: {
                LocationName: req.LocationName,
                Lat: req.Lat,
                Lng: req.Lng,
                Posting: {
                    create: {
                        User_id: user.User.User_id,
                        IsTeam: req.IsTeam,
                        Title: req.Title.toString(),
                        WriteDate: Date.now().toString(),
                        PlayTime: req.PlayTime,
                        Location: Location.result[0],
                        RecruitAmount: req.RecruitAmount,
                        CurrentAmount: req.CurrentAmount,
                        Introduce: req.Introduce,
                    },
                },
            },
        });
        return {
            TimeStamp: Date.now().toString(),
        };
    });
}
exports.AddMatch = AddMatch;
function MatchInfo(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const match = yield prisma.posting.findFirst({
            where: {
                Posting_id: request.body.id,
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
            const res = yield prisma.posting.findFirst({
                where: {
                    Location: location,
                },
            });
            return res;
        }
        else if (request.body.Search) {
            const search = request.body.Search;
            const res = yield prisma.posting.findFirst({
                where: {
                    Title: {
                        contains: search,
                    },
                },
            });
            return res;
        }
        else
            return { result: "error" };
    });
}
exports.MatchFilter = MatchFilter;
