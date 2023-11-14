"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessRefresh = exports.AccessVerify = exports.GenerateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function getCurrentTime() {
    return Math.floor(Date.now() / 1000);
}
function GenerateToken(UserData) {
    const data = JSON.parse(UserData);
    const Access_Token = jsonwebtoken_1.default.sign(data, `${process.env.SECRETKey}`, {
        expiresIn: "2h",
        algorithm: "HS256",
    });
    const Refresh_Token = jsonwebtoken_1.default.sign(data, `${process.env.SECRETKey}`, {
        expiresIn: "14d",
        algorithm: "HS256",
    });
    const res = {
        Access_Token: Access_Token,
        AToken_Expires: 7199,
        AToken_CreatedAt: getCurrentTime().toString(),
        Refresh_Token: Refresh_Token,
        RToken_Expires: 1209599,
        RToken_CreatedAt: getCurrentTime().toString(),
    };
    return res;
}
exports.GenerateToken = GenerateToken;
function AccessVerify(token) {
    try {
        jsonwebtoken_1.default.verify(token, `${process.env.SECRETKey}`);
        return true;
    }
    catch (err) {
        console.log(err);
        return false;
    }
}
exports.AccessVerify = AccessVerify;
function AccessRefresh(UserData) {
    const data = { data: UserData };
    const Access_Token = jsonwebtoken_1.default.sign(data, `${process.env.SECRET_Key}`, {
        expiresIn: "2h",
        algorithm: "HS256",
    });
    const res = {
        Access_Token: Access_Token,
        AToken_Expires: 7199,
        AToken_CreatedAt: getCurrentTime().toString(),
    };
    return res;
}
exports.AccessRefresh = AccessRefresh;
//# sourceMappingURL=token.js.map