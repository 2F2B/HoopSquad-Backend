import express from "express";
import { PrismaClient } from "@prisma/client";
import { AllMatch, AddMatch, MatchFilter, MatchInfo } from "../match/match";
import { BodyParser } from "body-parser";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

matchRouter.get("/filter", async (req, res) => {
  try {
    const add = await MatchFilter(req);
    res.status(200);
    res.send(add);
  } catch (err) {
    console.log(err);
    res.send({ result: "error" });
  }
});

matchRouter.get("/info", async (req, res) => {
  try {
    const add = await MatchInfo(req);
    res.status(200);
    res.send(add);
  } catch (err) {
    console.log(err);
    res.send({ result: "error" });
  }
});

matchRouter.post("/add", upload.single("Image"), async (req, res) => {
  try {
    // console.log(image);
    const add = await AddMatch(req);
    res.status(201);
    if (req.file) {
      storage._removeFile(req, req.file, (err) => {
        if (err) throw new Error("File Deletion Failed");
      });
    }
    res.send(add);
  } catch (err) {
    if (err instanceof Error) {
      res.status(401);
      console.log(err);
      res.send({ error: err.message });
    }
  }
});

module.exports = matchRouter;
