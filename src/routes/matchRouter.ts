import express from "express";
import { PrismaClient } from "@prisma/client";
import { AllMatch, AddMatch, MatchFilter, MatchInfo } from "../match/match";
import { BodyParser } from "body-parser";

const matchRouter = express.Router();

matchRouter.get("/", async (req, res) => {
  try {
    console.log(req.body);
    const result = await AllMatch(req);
    res.status(200);
    res.send(result);
  } catch (err) {
    if (err instanceof Error) {
      res.status(400);
      console.log(err);
      res.send({ error: err.message });
    }
  }
});

matchRouter.post("/", upload.single("Image"), async (req, res) => {
  try {
    const add = await AddMatch(req);
    res.status(201);
    res.send(req.body);
  } catch (err) {
    if (err instanceof Error) {
      res.status(401);
      console.log(err);
      res.send({ error: err.message });
    }
  }
});

module.exports = matchRouter;
