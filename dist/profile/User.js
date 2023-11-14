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
exports.setUserProfile = exports.getUserProfile = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function getUserProfile(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const Profile = yield prisma.user.findFirst({
            where: {
                User_id: userId,
            },
            select: {
                Name: true,
                Profile: true,
            },
        });
        return Object.assign(Object.assign({}, Profile === null || Profile === void 0 ? void 0 : Profile.Profile), { Name: Profile === null || Profile === void 0 ? void 0 : Profile.Name });
    });
}
exports.getUserProfile = getUserProfile;
function setUserProfile(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const isUser = yield prisma.oAuthToken.findFirst({
            where: {
                AccessToken: req.body.access_token,
            },
            select: {
                User_id: true,
            },
        });
        if (!isUser)
            throw new Error("User Not Exists");
        const profile = yield prisma.profile.update({
            where: {
                User_id: isUser.User_id,
            },
            data: {
                Height: req.body.Height,
                Age: req.body.Age,
                Position: req.body.Position,
                Grade: req.body.Grade,
                Introduce: req.body.Introduce,
                Location: req.body.Location,
            },
        });
        const type = yield prisma.gameType.findFirst({
            where: {
                Profile_id: profile.User_id,
            },
            select: {
                GameType_id: true,
            },
        });
        const updatedType = yield prisma.gameType.update({
            where: {
                GameType_id: type === null || type === void 0 ? void 0 : type.GameType_id,
            },
            data: {
                OneOnOne: req.body.One,
                ThreeOnThree: req.body.Three,
                FiveOnFive: req.body.Five,
            },
        });
        return Object.assign(Object.assign({}, profile), { GameType: updatedType });
    });
}
exports.setUserProfile = setUserProfile;
//# sourceMappingURL=../../src/map/profile/User.js.map