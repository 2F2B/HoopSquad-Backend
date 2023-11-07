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
const express_1 = __importDefault(require("express"));
const auth_1 = require("../auth/auth");
const kakaoAuth_1 = require("../auth/kakaoAuth");
const userDelete_1 = require("../auth/userDelete");
const validate_1 = require("../auth/validate");
const authRouter = express_1.default.Router();
authRouter.get("/google/register", (req, res) => {
    var url = (0, auth_1.SignupResponse)();
    res.redirect(url);
});
authRouter.get("/google/redirect", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.query;
    console.log(code);
    try {
        const Token = yield (0, auth_1.LoginGoogle)(code);
        res.send(`Register Success \n ${Token}`);
    }
    catch (err) {
        res.status(400);
        console.error(err);
        res.send({ result: "error" });
    }
}));
authRouter.post("/validation", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, validate_1.Validation)(req);
        if (result === null || result === void 0 ? void 0 : result.access_token)
            res.status(201); //Created
        else if ((result === null || result === void 0 ? void 0 : result.result) == "expired")
            res.status(401); //Unauthorized
        else if ((result === null || result === void 0 ? void 0 : result.result) == "no_token")
            res.status(400); //Bad Request
        else
            res.status(200); //OK
        res.send(result);
    }
    catch (err) {
        res.status(400);
        console.error(err);
        res.send({ result: "error" });
    }
}));
authRouter.get("/kakao/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(req.query.code);
        const data = yield (0, kakaoAuth_1.LoginKakao)(req.query.code);
        res.send({ token: data });
    }
    catch (err) {
        res.status(400);
        console.error(err);
        res.send({ result: "error" });
    }
}));
authRouter.get("/delete", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, userDelete_1.UserDelete)(req);
        res.send(result);
    }
    catch (err) { }
}));
module.exports = authRouter;
