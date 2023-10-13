"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const auth_db_1 = __importDefault(require("./database/auth_db"));
const app = (0, express_1.default)();
auth_db_1.default.connect();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.get("/", (_req, res) => {
    const sql = "SHOW TABLES";
    auth_db_1.default.query(sql, (err, rows) => {
        if (err) {
            console.error(err);
            return res.json(rows);
        }
        res.json({ connect: "OK" });
    });
});
app.listen(3000, () => {
    console.log("Server started on Port 3000");
});
