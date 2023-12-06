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
import { NotFoundError, UserNotWriterError } from "../match/error";
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
/*
 * 전체 매치 조회
 * header: all => 전체조회 / header: info => 상세 조회
 */
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
/*
 * 매치 추가
 */
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
    if (req.files && Array.isArray(req.files) && +req.files.length > 0) {
      const files = req.files;
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
    if (err instanceof NotFoundError) {
      handleErrors<NotFoundError>(err, res);
    } else if (err instanceof Error) {
      handleErrors<Error>(err, res);
    }
  }
});
/*
 * 전체 매치 삭제
 */
matchRouter.delete("/:id", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.slice(7);
    await DeleteMatch(+req.params.id, token);
    res.status(204).send();
  } catch (err) {
    if (err instanceof NotFoundError) {
      handleErrors<NotFoundError>(err, res);
    } else if (err instanceof UserNotWriterError) {
      handleErrors<UserNotWriterError>(err, res);
    } else if (err instanceof Error) {
      handleErrors<Error>(err, res);
    }
  }
});

matchRouter.post("/");

export default matchRouter;
