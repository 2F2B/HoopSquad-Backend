import express from "express";
import { PrismaClient } from "@prisma/client";
import { AllMatch, AddMatch, MatchInfo } from "../match/match";
import { BodyParser } from "body-parser";
import multer from "multer";
import path from "path";
import fs from "fs";

const parentDirectory = path.join(__dirname, "../../..");
const uploadsDirectory = path.join(parentDirectory, "uploads");
const storage = multer.memoryStorage();
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      //저장 위치: ../../../uploads
      cb(null, uploadsDirectory);
    },
    filename(req, file, cb) {
      //파일 이름: {이름}{시간}.{확장자}
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
      res.status(401);
      console.log(err);
      res.send({ error: err.message });
    }
  }
});

matchRouter.post("/", upload.array("Image", 10), async (req, res) => {
  try {
    // console.log(image);
    if (!req.body) throw new Error("Body Not Exists");
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
      // 파일을 먼저 저장하고 메서드가 실행되기 때문에 메서드 중간에 에러나면 저장된 파일 삭제
      if (req.files && +req.files.length > 0) {
        const files = req.files as Array<Express.Multer.File>;
        files.forEach((file: any) => {
          const filePath = path.join(uploadsDirectory, file.filename);
          fs.unlink(filePath, (unlinkErr: any) => {
            if (unlinkErr) {
              console.error("Error deleting file:", unlinkErr);
            }
          });
        });
      }
      res.status(401);
      console.log(err);
      res.send({ error: err.message });
    }
  }
});

module.exports = matchRouter;
