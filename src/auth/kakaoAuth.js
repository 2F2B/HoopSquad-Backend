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
exports.ValidateKakao = exports.LoginKakao = void 0;
const axios_1 = __importDefault(require("axios"));
const apiKey_1 = require("../apiKey");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function LoginKakao(code) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = yield axios_1.default.post("https://kauth.kakao.com/oauth/token", {
            grant_type: "authorization_code",
            client_id: apiKey_1.kakaoAPIKey,
            redirect_uri: "https://hoopsquad.link/auth/kakao/register",
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
                            AToken_CreatedAt: Math.floor(Date.now() / 1000).toString(),
                            RToken_CreatedAt: Math.floor(Date.now() / 1000).toString(),
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
                    AToken_CreatedAt: Math.floor(Date.now() / 1000).toString(),
                    RToken_CreatedAt: Math.floor(Date.now() / 1000).toString(),
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
//TODO: 유효성 검사 구현
function ValidateKakao(request) {
    return __awaiter(this, void 0, void 0, function* () {
        if (request.body.access_token) {
            //토큰 있음 -> 액세스 토큰 유효성 검사
            const tokenResult = yield prisma.oAuthToken.findFirst({
                where: {
                    AccessToken: request.body.access_token,
                },
            });
            if (tokenResult) {
                if (tokenResult.AToken_Expires + parseInt(tokenResult.AToken_CreatedAt) >
                    Math.floor(Date.now() / 1000) //액세스 토큰 유효
                )
                    return { result: "success" };
                else if (tokenResult.RToken_Expires + parseInt(tokenResult.RToken_CreatedAt) >
                    Math.floor(Date.now() / 1000) //액세스 토큰은 만료되었으나 리프레시 토큰이 유효
                ) {
                    console.log("Access Token Expired");
                    const newToken = yield axios_1.default.post("https://kauth.kakao.com/oauth/token", {
                        grant_type: "refresh_token",
                        client_id: apiKey_1.RESTAPIKey,
                        refresh_token: tokenResult.RefreshToken,
                    }, {
                        headers: {
                            "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
                        },
                    });
                    if (newToken.data.refresh_token) {
                        //리프레시 토큰의 유효기간이 얼마 남지 않아 리프레시 토큰이 발급됨
                        yield prisma.oAuthToken.updateMany({
                            where: {
                                Auth_id: tokenResult.Auth_id,
                            },
                            data: {
                                RefreshToken: newToken.data.refresh_token,
                                RToken_Expires: newToken.data.refresh_token_expires_in,
                                RToken_CreatedAt: Math.floor(Date.now() / 1000).toString(),
                                AToken_CreatedAt: Math.floor(Date.now() / 1000).toString(),
                            },
                        });
                    }
                    yield prisma.oAuthToken.updateMany({
                        //액세스 토큰 갱신
                        where: {
                            Auth_id: tokenResult.Auth_id,
                        },
                        data: {
                            AccessToken: newToken.data.access_token,
                            AToken_Expires: newToken.data.expires_in,
                            AToken_CreatedAt: Math.floor(Date.now() / 1000).toString(),
                        },
                    });
                    console.log(newToken.data);
                    return {
                        access_token: newToken.data.access_token,
                    };
                }
                else {
                    //액세스 토큰과 리프레시 토큰 모두 만료
                    return { result: "expired" };
                }
            }
            else
                return { result: "no_token" };
        }
        else
            return { result: "expired" }; //토큰이 없음
    });
}
exports.ValidateKakao = ValidateKakao;
