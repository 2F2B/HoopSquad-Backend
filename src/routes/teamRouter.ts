import express from "express";
import {
  createTeam,
  deleteTeam,
  getTeam,
  joinTeam,
  leaveTeam,
} from "../team/team";
import {
  NotAdminError,
  TeamNotFoundError,
  UserAlreadyInTeamError,
} from "../team/error";
import multer from "multer";
import path from "path";
import fs from "fs";
import { handleErrors } from "../ErrorHandler";
import sanitize from "sanitize-filename";

const teamRouter = express.Router();
const parentDirectory = path.join(__dirname, "../../.."); // __dirname == 이 코드 파일이 있는 절대 주소 ~~~/HOOPSQUAD-BACKEND/src/routes, "../../.." == 상위 폴더로 이동
const uploadsDirectory = path.join(parentDirectory, "image/team"); // ~~~/image/team 주소. 해당 변수는 주소에 대한 값(?)을 저장하는 것
fs.readdir(uploadsDirectory, (error) => {
  // 디렉토리를 읽어서 해당하는 디렉토리가 없으면 해당 디렉토리를 생성
  if (error) {
    fs.mkdirSync(uploadsDirectory);
  }
});
const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      //저장 위치: ../../../image/team
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
export interface CreateTeamType {
  Admin_id: string;
  Name: string;
  Location: string;
  Introduce?: string;
}

teamRouter.get("/", async (_req, res) => {
  try {
    const location = _req.query.location;
    const id = undefined;
    const result = await getTeam(id, location?.toString());
    res.status(200);
    res.json(result);
  } catch (err) {
    if (err instanceof Error) {
      handleErrors<Error>(err, res);
    }
  }
});

teamRouter.get("/:id", async (req, res) => {
  try {
    const result = await getTeam(+req.params.id);
    res.json(result);
  } catch (err) {
    if (err instanceof TeamNotFoundError) {
      handleErrors<TeamNotFoundError>(err, res);
    } else if (err instanceof Error) {
      handleErrors<Error>(err, res);
    }
  }
});

teamRouter.post("/:id", async (req, res) => {
  try {
    await joinTeam(+req.params.id, +req.body.User_id);
    res.status(201).json({ result: "success" });
  } catch (err) {
    if (err instanceof TeamNotFoundError) {
      handleErrors(err, res);
    } else if (err instanceof UserAlreadyInTeamError) {
      handleErrors(err, res);
    } else if (err instanceof Error) {
      handleErrors(err, res);
    }
  }
});

teamRouter.delete("/:id", async (req, res) => {
  try {
    await leaveTeam(+req.params.id, +req.body.User_id);
    res.status(204).send();
  } catch (err) {
    if (err instanceof TeamNotFoundError) {
      handleErrors(err, res);
    } else if (err instanceof Error) {
      handleErrors(err, res);
    }
  }
});

teamRouter.post(
  "/",
  upload.array("Image", 10),
  async (
    req: express.Request<{}, {}, CreateTeamType>,
    res: express.Response,
  ) => {
    try {
      const { Admin_id, Name, Location, Introduce } = req.body;
      let files;
      if (Array.isArray(req.files)) {
        files = req.files.map((file) => {
          return file.filename;
        });
      }
      await createTeam(
        {
          Admin_id: Admin_id,
          Name: Name,
          Location: Location,
          Introduce: Introduce,
        },
        files,
      );
      res.status(201).json({ result: "success" });
    } catch (err) {
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
      if (err instanceof Error) {
        handleErrors(err, res);
      }
    }
  },
);

teamRouter.delete(
  "/",
  async (
    req: express.Request<{}, {}, {}, { team_id: number; user_id: number }>,
    res,
  ) => {
    try {
      await deleteTeam(+req.query.team_id, +req.query.user_id);
      res.send();
    } catch (err) {
      if (err instanceof TeamNotFoundError) {
        handleErrors(err, res);
      } else if (err instanceof NotAdminError) {
        handleErrors(err, res);
      } else if (err instanceof Error) {
        handleErrors(err, res);
      }
    }
  },
);

export default teamRouter;
