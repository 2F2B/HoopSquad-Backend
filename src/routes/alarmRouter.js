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
const alarm_1 = require("../alarm/alarm");
const alarmRouter = express_1.default.Router();
alarmRouter.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, alarm_1.getAlarm)(+req.params.id);
        res.json(result);
    }
    catch (err) {
        console.error(err);
        res.status(403);
        res.json({ result: "error" });
    }
}));
alarmRouter.post("/match", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, alarm_1.applyMatch)(req.body);
        res.json({ result: "success" });
    }
    catch (err) {
        console.error(err);
        res.status(403);
        res.json({ result: "error" });
    }
}));
module.exports = alarmRouter;
