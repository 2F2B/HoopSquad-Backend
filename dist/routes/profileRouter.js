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
const User_1 = require("../profile/User");
const profileRouter = express_1.default.Router();
profileRouter.get("/user/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, User_1.getUserProfile)(+req.params.id);
        if (!result)
            throw new Error("Profile Not Found");
        res.send(result);
    }
    catch (err) {
        res.status(400);
        console.error(err);
        res.send({ result: "error" });
    }
}));
module.exports = profileRouter;
//# sourceMappingURL=../../src/map/routes/profileRouter.js.map