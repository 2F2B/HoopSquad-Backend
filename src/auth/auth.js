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
exports.ValidateGoogle = exports.LoginGoogle = exports.SignupResponse = void 0;
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
        console.log(user);
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
            console.log(Token.Access_Token, "\n");
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
            console.log(Token.Access_Token, "\n");
            return Token.Access_Token;
        }
    });
}
exports.LoginGoogle = LoginGoogle;
function ValidateGoogle(// 유저 토큰 넘어옴
req) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.body.access_token) {
            const TokenResult = yield prisma.oAuthToken.findFirst({
                // 유저 토큰이 DB에 있는지 검사
                where: {
                    AccessToken: req.body.access_token,
                },
            });
            if (TokenResult) {
                //유저 토큰이 DB에 있다
                if (yield (0, token_1.AccessVerify)(req.body.access_token)) {
                    //액세스 토큰이 유효
                    return { result: "success" };
                }
                else {
                    //액세스 토큰 X
                    if (
                    // 리프레시 토큰의 유효기간 1주일 초과
                    TokenResult.RToken_Expires + parseInt(TokenResult.RToken_CreatedAt) >
                        604800) {
                        const user_data = {
                            Auth_id: TokenResult.Auth_id,
                        };
                        const NewToken = (0, token_1.AccessRefresh)(user_data);
                        yield prisma.oAuthToken.updateMany({
                            //새 토큰 발급 받아서 DB 갱신 후 토큰 반환
                            where: {
                                Auth_id: TokenResult.Auth_id,
                            },
                            data: {
                                AccessToken: NewToken.Access_Token,
                                AToken_CreatedAt: NewToken.AToken_CreatedAt,
                                AToken_Expires: NewToken.AToken_Expires,
                            },
                        });
                        return { access_token: NewToken.Access_Token };
                    }
                    else if (
                    //리프레시 토큰의 유효기간 1주일 이하
                    TokenResult.RToken_Expires + parseInt(TokenResult.RToken_CreatedAt) <=
                        604800) {
                        const user_data = {
                            Auth_id: TokenResult.Auth_id,
                        };
                        const NewTokens = (0, token_1.GenerateToken)(user_data);
                        yield prisma.oAuthToken.updateMany({
                            //새로 발급받은 토큰들 DB 갱신, 반환
                            where: {
                                Auth_id: TokenResult.Auth_id.toString(),
                            },
                            data: {
                                AccessToken: NewTokens.Access_Token,
                                RefreshToken: NewTokens.Refresh_Token,
                                AToken_Expires: NewTokens.AToken_Expires,
                                RToken_Expires: NewTokens.RToken_Expires,
                                AToken_CreatedAt: NewTokens.AToken_CreatedAt,
                                RToken_CreatedAt: NewTokens.RToken_CreatedAt,
                            },
                        });
                        return { access_token: NewTokens.Access_Token };
                    }
                }
            }
            else
                return { result: "expired" }; // DB에 액세스 토큰이 없음
        }
        else
            return { result: "no_token" }; // 액세스 토큰이 전달되지 없음
    });
}
exports.ValidateGoogle = ValidateGoogle;
