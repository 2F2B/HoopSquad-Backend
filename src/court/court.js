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
exports.addCourt = exports.getCourt = void 0;
const client_1 = require("@prisma/client");
const googleMaps_1 = require("../google-maps/googleMaps");
const prisma = new client_1.PrismaClient();
/**
 * 농구장 정보를 가져오는 함수
 * @param id
 * @returns
 */
function getCourt(id) {
    return __awaiter(this, void 0, void 0, function* () {
        if (id) {
            const court = yield prisma.court.findMany({
                where: {
                    Court_id: id,
                },
                select: {
                    Court_id: true,
                    Name: true,
                    Location: true,
                    Map: {
                        select: {
                            Lat: true,
                            Lng: true,
                        },
                    },
                },
            });
            prisma.$disconnect();
            return court;
        }
        else {
            const court = yield prisma.court.findMany({
                select: {
                    Court_id: true,
                    Name: true,
                    Location: true,
                },
            });
            prisma.$disconnect();
            return court;
        }
    });
}
exports.getCourt = getCourt;
function addCourt(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const Location = yield (0, googleMaps_1.LatLngToAddress)(req.Lat, req.Lng);
        const IsExist = yield prisma.court.findMany({
            where: {
                OR: [
                    { Name: req.Name },
                    { Map: { AND: [{ Lat: req.Lat }, { Lng: req.Lng }] } },
                ],
            },
        });
        if (IsExist.length != 0) {
            return {
                Code: 400,
                TimeStamp: Date.now().toString(),
            };
        }
        yield prisma.court.create({
            data: {
                Name: req.Name,
                Date: Date.now().toString(),
                Location: Location.result[0],
                Map: {
                    create: {
                        LocationName: req.Name,
                        Lat: req.Lat,
                        Lng: req.Lng,
                    },
                },
            },
        });
        return {
            Code: 200,
            TimeStamp: Date.now().toString(),
        };
    });
}
exports.addCourt = addCourt;
