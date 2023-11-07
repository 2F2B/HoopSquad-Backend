"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const match_1 = require("../match/match");
const matchRouter = express_1.default.Router();
matchRouter.get("/", (req, res) => {
    // 전체 게시글 조회
    try {
        const result = (0, match_1.AllMatch)(req);
        res.send(result);
    }
    catch (err) {
        console.log(err);
        res.send({ result: "error" });
    }
});
matchRouter.get("/add", (req, res) => {
    try {
        const add = (0, match_1.AddMatch)(req);
        res.send(add);
    }
    catch (err) {
        console.log(err);
        res.send({ result: "error" });
    }
});
module.exports = matchRouter;
