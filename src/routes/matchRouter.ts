import express from "express";
import { PrismaClient } from "@prisma/client";
import {
  AllMatch,
  AddMatch,
  MatchInfo,
  DeleteMatch,
  JoinMatch,
} from "../match/match";
import { BodyParser } from "body-parser";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  SortNotFoundError,
  GameTypeNotFoundError,
  Posting_idNotFoundError,
  UserNotFoundError,
  PostingNotFoundError,
  UserNotWriterError,
} from "../match/error";
import { ErrorWithStatusCode, handleErrors } from "../ErrorHandler";

const parentDirectory = path.join(__dirname, "../../.."); // __dirname == 이 코드 파일이 있는 절대 주소 ~~~/HOOPSQUAD-BACKEND/src/routes, "../../.." == 상위 폴더로 이동
const uploadsDirectory = path.join(parentDirectory, "image/match"); // ~~~/image/match 주소. 해당 변수는 주소에 대한 값(?)을 저장하는 것
const storage = multer.memoryStorage();
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      //저장 위치: ../../../image/match
      cb(null, uploadsDirectory);
    },
    filename(req, file, cb) {
      //파일 이름: {이름}{시간}.{확장자}
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 파일 크기 제한 5mb
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
    if (err instanceof ErrorWithStatusCode) {
      handleErrors(err, res);
    } else if (err instanceof Error) {
      handleErrors(err, res);
    }
  }
});

matchRouter.post("/", upload.array("Image", 10), async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.slice(7);
    if (!req.body) throw new Error("Body Not Exists");
    const add = await AddMatch(req, token);
    res.status(201);
    res.send(add);
  } catch (err) {
    // 파일을 먼저 저장하고 메서드가 실행되기 때문에 메서드 중간에 에러나면 저장된 파일 삭제
    if (req.files && +req.files.length > 0) {
      const files = req.files as Array<Express.Multer.File>; // File 배열이라고 명시
      files.forEach((file: any) => {
        const filePath = path.join(uploadsDirectory, file.filename); // 업로드 폴더의 파일 지정
        fs.unlink(filePath, (unlinkErr: any) => {
          // 해당 파일 삭제
          if (unlinkErr) {
            console.error("Error deleting file:", unlinkErr);
          }
        });
      });
    }
    if (err instanceof UserNotFoundError) {
      handleErrors(err, res);
    }
  }
});

matchRouter.delete("/:id", async (req, res) => {
  try {
    await DeleteMatch(+req.params.id, req.body.access_token);
    res.status(204).send();
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      handleErrors(err, res);
    } else if (err instanceof UserNotWriterError) {
      handleErrors(err, res);
    }
  }
});

export default matchRouter;
