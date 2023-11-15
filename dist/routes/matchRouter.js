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
const match_1 = require("../match/match");
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
const matchRouter = express_1.default.Router();
matchRouter.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(req.body);
        const result = yield (0, match_1.AllMatch)(req);
        res.status(200);
        res.send(result);
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(400);
            console.log(err);
            res.send({ error: err.message });
        }
    }
}));
matchRouter.get("/filter", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const add = yield (0, match_1.MatchFilter)(req);
        res.status(200);
        res.send(add);
    }
    catch (err) {
        console.log(err);
        res.send({ result: "error" });
    }
}));
matchRouter.get("/info", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const add = yield (0, match_1.MatchInfo)(req);
        res.status(200);
        res.send(add);
    }
    catch (err) {
        console.log(err);
        res.send({ result: "error" });
    }
}));
matchRouter.post("/add", upload.single("Image"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // console.log(image);
        const add = yield (0, match_1.AddMatch)(req);
        res.status(201);
        if (req.file) {
            storage._removeFile(req, req.file, (err) => {
                if (err)
                    throw new Error("File Deletion Failed");
            });
        }
        res.send(add);
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(401);
            console.log(err);
            res.send({ error: err.message });
        }
    }
}));
module.exports = matchRouter;
//# sourceMappingURL=matchRouter.js.map