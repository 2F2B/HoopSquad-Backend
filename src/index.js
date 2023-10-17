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
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const client_1 = require("@prisma/client");
const court_1 = require("./court/court");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.get("/", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.$queryRaw `SHOW TABLES`;
        res.send({ connect: "OK" });
    }
    catch (err) {
        res.json(err);
        return console.error(err);
    }
}));
app.get("/api/court", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
}));
app.post("/api/court/add", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, court_1.addCourt)(req.body);
    res.json(result);
}));
app.listen(3000, () => {
    console.log("Server started on Port 3000");
});
