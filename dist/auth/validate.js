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
exports.Validation = void 0;
const client_1 = require("@prisma/client");
const token_1 = require("./token");
const prisma = new client_1.PrismaClient();
const oneWeekInSeconds = 604799;
function isTokenValidMoreThanAWeek(token) {
    if (token.RToken_Expires + parseInt(token.RToken_CreatedAt) >
        oneWeekInSeconds)
        return true;
    else
        return false;
}
function Validation(request) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!request.body.access_token) {
            // A/T 가 안넘어옴
            throw new Error("Body Not Exist");
        }
        const token = yield prisma.oAuthToken.findFirst({
            where: {
                AccessToken: request.body.access_token,
            },
        });
        if (!token)
            throw new Error("Token Not Exist");
        if ((0, token_1.AccessVerify)(token.AccessToken)) {
            return { result: "success", User_id: token.User_id };
        } // A/T O
        if (!(0, token_1.AccessVerify)(token.RefreshToken))
            throw new Error("Token Expired"); // A/T X, R/T X
        if (isTokenValidMoreThanAWeek(token)) {
            const newToken = (0, token_1.AccessRefresh)(token.Auth_id);
            yield prisma.oAuthToken.updateMany({
                where: {
                    Auth_id: token.Auth_id,
                },
                data: {
                    AccessToken: newToken.Access_Token,
                    AToken_CreatedAt: newToken.AToken_CreatedAt,
                    AToken_Expires: newToken.AToken_Expires,
                },
            });
            return { access_token: newToken.Access_Token, User_id: token.User_id };
        }
        else {
            const newTokens = (0, token_1.GenerateToken)(token.Auth_id);
            yield prisma.oAuthToken.updateMany({
                where: {
                    Auth_id: token.Auth_id,
                },
                data: {
                    AccessToken: newTokens.Access_Token,
                    RefreshToken: newTokens.Refresh_Token,
                    AToken_Expires: newTokens.AToken_Expires,
                    RToken_Expires: newTokens.RToken_Expires,
                    AToken_CreatedAt: newTokens.AToken_CreatedAt,
                    RToken_CreatedAt: newTokens.RToken_CreatedAt,
                },
            });
            return { access_token: newTokens.Access_Token, User_id: token.User_id };
        }
    });
}
exports.Validation = Validation;
//# sourceMappingURL=validate.js.map