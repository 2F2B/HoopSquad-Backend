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
const client_1 = require("@prisma/client");
function getTeam(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const prisma = new client_1.PrismaClient();
        if (!id) {
            const teams = yield prisma.teamProfile.findMany();
            const result = [];
            teams.every((team) => {
                result.push({
                    Team_id: team.Team_id,
                    Name: team.Name,
                    TeamImage: team.TeamImage,
                    Location: team.Location,
                    LatestDate: team.LatestDate,
                    UserAmount: team.UserAmount,
                });
            });
            return result;
        }
        else {
            //id가 있음
            const team = yield prisma.teamProfile.findFirst({
                where: {
                    Team_id: id,
                },
            });
            if (team) {
                return team;
            }
            else
                return { result: "error" };
        }
    });
}
exports.default = getTeam;
