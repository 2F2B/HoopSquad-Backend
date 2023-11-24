import express from "express";
import { PrismaClient } from "@prisma/client";
import { AllMatch, AddMatch, MatchInfo } from "../match/match";
import { BodyParser } from "body-parser";
import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, "uploads/");
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const matchRouter = express.Router();

matchRouter.get("/", async (req, res) => {
  try {
    let result;
    if (req.query.all) result = await AllMatch(req);
    else if (req.query.info) result = await MatchInfo(req);
    else throw new Error("Bad Request");
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

matchRouter.post("/", upload.array("Image", 10), async (req, res) => {
  try {
    if (!req.body) throw new Error("Body Not Exists");
    const add = await AddMatch(req);
    res.status(201);
    // if (req.files) {
    //   storage._removeFile(req, req.files, (err) => {
    //     if (err) throw new Error("File Deletion Failed");
    //   });
    // }
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
