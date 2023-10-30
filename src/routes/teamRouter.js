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
const teamSearch_1 = __importDefault(require("../team/teamSearch"));
const teamRouter = express_1.default.Router();
teamRouter.get("/list", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (typeof req.query.team_id === "string") {
        const result = yield (0, teamSearch_1.default)(parseInt(req.query.team_id));
        res.status(200);
        res.json(result);
    }
    else {
        const result = yield (0, teamSearch_1.default)();
        res.status(200);
        res.json(result);
    }
}));
module.exports = teamRouter;
