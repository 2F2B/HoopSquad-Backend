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
        if (token) {
            if ((0, token_1.AccessVerify)(token.AccessToken)) {
                return { result: "success", User_id: token.User_id };
            } // A/T O
            if (!(0, token_1.AccessVerify)(token.RefreshToken))
                return { result: "expired" }; // A/T X, R/T X
            if ((0, token_1.AccessVerify)(token.AccessToken)) {
                return { result: "success", User_id: token.User_id };
            } // A/T O
            if (!(0, token_1.AccessVerify)(token.RefreshToken))
                throw new Error("Token Expired"); // A/T X, R/T X
            if (isTokenValidMoreThanAWeek(token)) {
                const newToken = (0, token_1.AccessRefresh)(token.Auth_id);
                return { access_token: newToken.Access_Token, User_id: token.User_id };
            }
            else {
                const newTokens = (0, token_1.GenerateToken)(token.Auth_id);
                return { access_token: newToken.Access_Token, User_id: token.User_id };
            }
            {
                const newTokens = (0, token_1.GenerateToken)(token.Auth_id);
                return { access_token: newTokens.Access_Token, User_id: token.User_id };
            }
        }
    });
}
exports.Validation = Validation;
//# sourceMappingURL=../../src/map/auth/validate.js.map