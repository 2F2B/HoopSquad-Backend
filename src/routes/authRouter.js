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
const kakaoAuth_1 = require("../auth/kakaoAuth");
const authRouter = express_1.default.Router();
authRouter.get("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, kakaoAuth_1.LoginKakao)(req.query.code);
        res.send(data);
    }
    catch (err) {
        res.status(400);
        res.send({ result: "error" });
    }
}));
exports.default = authRouter;