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
const authRouter = express_1.default.Router();
authRouter.get("/google/register", (req, res) => {
    var url = (0, auth_1.SignupResponse)();
    res.redirect(url);
});
authRouter.get("/google/login", (req, res) => {
    var url = (0, auth_1.LoginResponse)();
    res.redirect(url);
});
authRouter.get("/google/reg_redirect", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.query;
    console.log(`reg_redirect`);
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
authRouter.post("/google/validation", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, auth_1.ValidateGoogle)(req);
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
authRouter.post("/kakao/validation", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, kakaoAuth_1.ValidateKakao)(req);
        res.send(result);
    }
    catch (err) {
        res.status(400);
        console.error(err);
        res.send({ result: "error" });
    }
}));
module.exports = authRouter;
