"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../auth/auth"));
const authRouter = express_1.default.Router();
authRouter.use("/", (req, res) => {
    res.send((0, auth_1.default)());
});
exports.default = authRouter;
