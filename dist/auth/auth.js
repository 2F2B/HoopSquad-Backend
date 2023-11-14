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
exports.Login = exports.Register = void 0;
const client_1 = require("@prisma/client");
const token_1 = require("./token");
const prisma = new client_1.PrismaClient();
function NameGen() {
    const rand = Math.floor(Math.random() * (999999 - 0)) + 0;
    const name = "user-" + rand.toString();
    return name;
}
function Register(req) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.body.Email == undefined)
            return { result: "error" };
        const isExist = yield prisma.userData.findFirst({
            // 유저가 이미 가입했는지 확인
            where: { Email: req.body.Email },
        });
        if (isExist)
            return { result: "isUser" }; //가입 유저
        // 미가입 유저
        const newUser = yield prisma.user.create({
            data: {
                Name: NameGen(),
                UserData: {
                    create: {
                        Email: req.body.Email,
                        Password: req.body.Password,
                    },
                },
            },
        });
        const newToken = yield (0, token_1.GenerateToken)(JSON.stringify({ Auth_id: newUser.User_id }));
        yield prisma.oAuthToken.create({
            data: {
                User_id: newUser.User_id,
                AccessToken: newToken.Access_Token,
                RefreshToken: newToken.Refresh_Token,
                AToken_Expires: newToken.AToken_Expires,
                RToken_Expires: newToken.RToken_Expires,
                AToken_CreatedAt: newToken.AToken_CreatedAt,
                RToken_CreatedAt: newToken.RToken_CreatedAt,
                Auth_id: newUser.User_id.toString(),
            },
        });
        return { token: newToken.Access_Token };
    });
}
exports.Register = Register;
function Login(req) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.body.Email == undefined)
            return { result: "error" };
        const isExist = yield prisma.userData.findFirst({
            where: {
                Email: req.body.Email,
            },
        });
        if (!isExist)
            return { result: "notUser" }; // DB에 유저 없음
        if (isExist.Password != req.body.Password)
            return { result: "PasswordError" };
        // DB에 유저 있음
        const newToken = yield (0, token_1.GenerateToken)(JSON.stringify({ Auth_id: isExist.User_id }));
        yield prisma.oAuthToken.create({
            data: {
                User_id: isExist.User_id,
                AccessToken: newToken.Access_Token,
                RefreshToken: newToken.Refresh_Token,
                AToken_Expires: newToken.AToken_Expires,
                RToken_Expires: newToken.RToken_Expires,
                AToken_CreatedAt: newToken.AToken_CreatedAt,
                RToken_CreatedAt: newToken.RToken_CreatedAt,
                Auth_id: isExist.User_id.toString(),
            },
        });
        return { token: newToken.Access_Token };
    });
}
exports.Login = Login;
//# sourceMappingURL=auth.js.map