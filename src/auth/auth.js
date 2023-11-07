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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginGoogle = exports.SignupResponse = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const token_1 = require("./token");
const prisma = new client_1.PrismaClient();
function getCurrentTime() {
    //현재시간
    return Math.floor(Date.now() / 1000);
}
function SignupResponse() {
    let url = "https://accounts.google.com/o/oauth2/v2/auth";
    url += `?client_id=${process.env.gClientId}`;
    url += `&redirect_uri=${process.env.gSignupRedirectUri}`;
    // url += `&redirect_uri=http://localhost:3000/auth/google/redirect`; //테스트용 로컬 호스트
    url += `&response_type=code`;
    url += `&scope=profile`;
    url += `&access_type=offline`;
    return url;
}
exports.SignupResponse = SignupResponse;
function LoginGoogle(// 유저 코드 넘어옴
code) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield axios_1.default.post(`${process.env.gTokenUri}`, {
            // google에서 받은 코드를 통해 access 토큰 발급
            code,
            client_id: `${process.env.gClientId}`,
            client_secret: `${process.env.gClientSecret}`,
            redirect_uri: `${process.env.gSignupRedirectUri}`,
            // redirect_uri: "http://localhost:3000/auth/google/redirect", //test용 로컬 호스트
            grant_type: "authorization_code",
        });
        const user = yield axios_1.default.get(`${process.env.gUserInfoUri}`, {
            // 발급받은 access 토큰으로 유저 데이터 요청
            headers: {
                Authorization: `Bearer ${res.data.access_token}`,
            },
        });
        const UserData = {
            Auth_id: user.data.id,
        };
        const Token = (0, token_1.GenerateToken)(JSON.stringify(UserData)); // JWT 토큰 발행
        const isUserExist = yield prisma.oAuthToken.findFirst({
            where: {
                Auth_id: user.data.id.toString(),
            },
        });
        if (!isUserExist) {
            // 유저 정보가 DB에 없으면  유저 정보 DB에 추가
            const result = yield prisma.user.create({
                data: {
                    Name: user.data.name,
                    OAuthToken: {
                        create: {
                            Auth_id: user.data.id.toString(),
                            AccessToken: Token.Access_Token,
                            RefreshToken: Token.Refresh_Token,
                            AToken_Expires: Token.AToken_Expires,
                            RToken_Expires: Token.RToken_Expires,
                            AToken_CreatedAt: Token.AToken_CreatedAt,
                            RToken_CreatedAt: Token.RToken_CreatedAt,
                        },
                    },
                },
                include: {
                    OAuthToken: true,
                },
            });
            return Token.Access_Token;
        }
        else {
            //유저 정보가 DB에 있음 -> 액세스 토큰과 리프레시 토큰을 새로 발급해서 DB에 갱신
            yield prisma.oAuthToken.updateMany({
                where: {
                    Auth_id: user.data.id.toString(),
                },
                data: {
                    AccessToken: Token.Access_Token,
                    RefreshToken: Token.Refresh_Token,
                    AToken_Expires: Token.AToken_Expires,
                    RToken_Expires: Token.RToken_Expires,
                    AToken_CreatedAt: Token.AToken_CreatedAt,
                    RToken_CreatedAt: Token.RToken_CreatedAt,
                },
            });
            return Token === null || Token === void 0 ? void 0 : Token.Access_Token;
        }
    });
}
exports.LoginGoogle = LoginGoogle;
