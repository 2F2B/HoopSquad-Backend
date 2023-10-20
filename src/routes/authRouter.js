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
const axios_1 = __importDefault(require("axios"));
const GAuthKeys_1 = require("../GAuthKeys");
const kakaoAuth_1 = require("../auth/kakaoAuth");
const authRouter = express_1.default.Router();
authRouter.get("/signup", (req, res) => {
    var url = (0, auth_1.SignupResponse)();
    console.log(url);
    res.redirect(url);
});
authRouter.get("/login", (req, res) => {
    var url = (0, auth_1.AuthResponse)();
    console.log(url);
    res.redirect(url);
});
authRouter.get("/signup/redirect", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.query;
    console.log(`code: /${code}`);
    const resp = yield axios_1.default.post(GAuthKeys_1.gToken_uri, {
        code,
        client_id: GAuthKeys_1.gClientId,
        client_secret: GAuthKeys_1.gClientSecret,
        redirect_uri: GAuthKeys_1.gSignup_Redirect_uri,
        grant_type: "authorization_code",
    });
    const resp2 = yield axios_1.default.get(GAuthKeys_1.gUserInfoUri, {
        headers: {
            Authorization: `Bearer ${resp.data.access_token}`,
        },
    });
    res.json(resp2.data);
}));
authRouter.get("/login/redirect", (req, res) => {
    const { code } = req.query;
    console.log(`code: /${code}`);
    res.send("ok");
});
authRouter.get("/kakao/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
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
exports.default = authRouter;
