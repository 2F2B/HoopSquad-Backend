"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignupResponse = exports.AuthResponse = void 0;
const GAuthKeys_1 = require("../GAuthKeys");
function AuthResponse() {
    let url = 'https://accounts.google.com/o/oauth2/v2/auth';
    url += `?client_id=${GAuthKeys_1.gClientId}`;
    url += `&redirect_uri=${GAuthKeys_1.gLoginRedirectUri}`;
    url += `&response_type=code`;
    url += `&scope=email profile`;
    return url;
}
exports.AuthResponse = AuthResponse;
function SignupResponse() {
    let url = 'https://accounts.google.com/o/oauth2/v2/auth';
    url += `?client_id=${GAuthKeys_1.gClientId}`;
    url += `&redirect_uri=${GAuthKeys_1.gSignup_Redirect_uri}`;
    url += `&response_type=code`;
    url += `&scope=email profile`;
    return url;
}
exports.SignupResponse = SignupResponse;
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
function LoginKakao(code) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield axios_1.default.post("https://kauth.kakao.com/oauth/token", {
            grant_type: "authorization_code",
            client_id: apiKey_1.kakaoAPIKey,
            redirect_uri: "http://ec2-52-79-227-4.ap-northeast-2.compute.amazonaws.com/auth/register",
            code: code,
        }, {
            headers: {
                "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
            },
        });
        return result.data;
    });
}
exports.LoginKakao = LoginKakao;
