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
exports.LoginKakao = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const token_1 = require("./token");
const prisma = new client_1.PrismaClient();
function getCurrentTime() {
    return Math.floor(Date.now() / 1000);
}
function LoginKakao(code) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield axios_1.default.post("https://kauth.kakao.com/oauth/token", {
            grant_type: "authorization_code",
            client_id: `${process.env.kakaoAPIKey}`,
            redirect_uri: "https://hoopsquad.link/auth/kakao/register",
            // redirect_uri: "http://localhost:3000/auth/kakao/register", // 테스트용 localhost
            code: code,
        }, {
            headers: {
                "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
            },
        }); //발급된 인가 코드로 토큰 발급
        const user = yield axios_1.default.get("https://kapi.kakao.com/v2/user/me", {
            headers: {
                Authorization: `Bearer ${token.data.access_token}`,
                "Content-Type": "	Content-type: application/x-www-form-urlencoded;charset=utf-8",
            },
        }); //발급된 토큰을 가진 유저의 정보 요청
        const userData = {
            Auth_id: user.data.id,
        };
        const newToken = (0, token_1.GenerateToken)(JSON.stringify(userData)); // JWT 토큰 발행
        const isUserExist = yield prisma.oAuthToken.findFirst({
            where: {
                Auth_id: user.data.id.toString(),
            },
        });
        if (!isUserExist) {
            //유저 정보가 DB에 없음
            const result = yield prisma.user.create({
                //유저 정보를 DB에 추가
                data: {
                    Name: user.data.properties.nickname,
                    OAuthToken: {
                        create: {
                            Auth_id: user.data.id.toString(),
                            AccessToken: newToken.Access_Token,
                            RefreshToken: newToken.Refresh_Token,
                            AToken_Expires: newToken.AToken_Expires,
                            RToken_Expires: newToken.RToken_Expires,
                            AToken_CreatedAt: newToken.AToken_CreatedAt,
                            RToken_CreatedAt: newToken.RToken_CreatedAt,
                        },
                    },
                },
                include: {
                    OAuthToken: true,
                },
            });
            return newToken.Access_Token;
        }
        else {
            //유저 정보가 DB에 있음 -> 액세스 토큰과 리프레시 토큰을 새로 발급해서 DB에 갱신
            yield prisma.oAuthToken.updateMany({
                where: {
                    Auth_id: user.data.id.toString(),
                },
                data: {
                    AccessToken: newToken.Access_Token,
                    RefreshToken: newToken.Refresh_Token,
                    AToken_Expires: newToken.AToken_Expires,
                    RToken_Expires: newToken.RToken_Expires,
                    AToken_CreatedAt: newToken.AToken_CreatedAt,
                    RToken_CreatedAt: newToken.RToken_CreatedAt,
                },
            });
            return newToken === null || newToken === void 0 ? void 0 : newToken.Access_Token;
        }
    });
}
exports.LoginKakao = LoginKakao;
