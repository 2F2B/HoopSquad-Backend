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
const court_1 = require("../court/court");
const courtRouter = express_1.default.Router();
courtRouter.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result;
        if (req.query.id) {
            //쿼리 문자열 있음
            if (typeof req.query.id === "string") {
                result = yield (0, court_1.getCourt)(parseInt(req.query.id));
                res.json(result);
            }
        }
        else {
            //쿼리 문자열 없음
            result = yield (0, court_1.getCourt)();
            res.json(result);
        }
    }
    catch (err) {
        res.status(400);
        res.json({ result: "error" });
    }
}));
courtRouter.post("/add", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, court_1.addCourt)(req.body);
    res.status(result.Code);
    res.json(result);
}));
module.exports = courtRouter;
