import express from "express";
import { PrismaClient } from "@prisma/client";
import { AllMatch, AddMatch } from "../match/match";

const matchRouter = express.Router();

matchRouter.get("/", (req, res) => {
  // 전체 게시글 조회
  try {
    const result = AllMatch(req);
    res.send(result);
  } catch (err) {
    console.log(err);
    res.send({ result: "error" });
  }
});

matchRouter.get("/add", (req, res) => {
  try {
    const add = AddMatch(req);
    res.send(add);
  } catch (err) {
    console.log(err);
    res.send({ result: "error" });
  }
});

module.exports = matchRouter;
