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
exports.AddMatch = exports.AllMatch = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function AllMatch(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const match = yield prisma.posting.findMany();
        console.log(match);
    });
}
exports.AllMatch = AllMatch;
function AddMatch(request) {
    return __awaiter(this, void 0, void 0, function* () {
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
        // await prisma.posting.create({
        //   data: {
        //     User_id: user.User.User_id,
        //     IsTeam: req.isTeam.parseInt(),
        //     Title: req.Title,
        //     WriteDate: Date.now().toString(),
        //     PlayTime: req.PlayTime,
        //     Location: req.Location,
        //     RecruitAmount: req.RecruitAmount,
        //     CurrentAmount: req.CurrentAmount,
        //     Map: {
        //       create: {
        //         LocationName: req.Title,
        //         Lat: req.lat,
        //         Lng: req.Lng,
        //       },
        //     },
        //   },
        // });
    });
}
exports.AddMatch = AddMatch;
