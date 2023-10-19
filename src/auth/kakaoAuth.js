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
const apiKey_1 = require("../apiKey");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function LoginKakao(code) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield axios_1.default.post("https://kauth.kakao.com/oauth/token", {
            grant_type: "authorization_code",
            client_id: apiKey_1.kakaoAPIKey,
            redirect_uri: "http://localhost:3000/auth/kakao/register",
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
        const isUserExist = yield prisma.oAuthToken.findFirst({
            where: {
                Auth_id: user.data.id.toString(),
            },
        });
        const currentTimeInSecond = Math.floor(Date.now() / 1000);
        const expires_in = token.data.expires_in;
        const refresh_token_expires_in = token.data
            .refresh_token_expires_in;
        if (!isUserExist) {
            //유저 정보가 DB에 없음
            const result = yield prisma.user.create({
                //유저 정보를 DB에 추가
                data: {
                    Name: user.data.properties.nickname,
                    OAuthToken: {
                        create: {
                            Auth_id: user.data.id.toString(),
                            AccessToken: token.data.access_token,
                            RefreshToken: token.data.refresh_token,
                            AToken_Expires: expires_in,
                            RToken_Expires: refresh_token_expires_in,
                            CreatedAt: currentTimeInSecond.toString(),
                        },
                    },
                },
                include: {
                    OAuthToken: true,
                },
            });
            return result.OAuthToken[0].AccessToken;
        }
        else {
            //유저 정보가 DB에 있음 -> 액세스 토큰과 리프레시 토큰을 새로 발급해서 DB에 갱신
            yield prisma.oAuthToken.updateMany({
                where: {
                    Auth_id: user.data.id.toString(),
                },
                data: {
                    AccessToken: token.data.access_token,
                    RefreshToken: token.data.refresh_token,
                    AToken_Expires: expires_in,
                    RToken_Expires: refresh_token_expires_in,
                    CreatedAt: currentTimeInSecond.toString(),
                },
            });
            const result = yield prisma.oAuthToken.findFirst({
                where: { Auth_id: user.data.id.toString() },
            });
            return result === null || result === void 0 ? void 0 : result.AccessToken;
        }
    });
}
exports.LoginKakao = LoginKakao;
