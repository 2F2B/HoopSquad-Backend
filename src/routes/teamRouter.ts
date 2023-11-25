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
import { handleErrors } from "../ErrorHandler";

const teamRouter = express.Router();

export interface CreateTeamType {
  Admin_id: number;
  Name: string;
  TeamImage?: Blob;
  Location: string;
  Introduce?: string;
}

teamRouter.get("/", async (_req, res) => {
  try {
    const result = await getTeam();
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
  async (req: express.Request<{}, {}, CreateTeamType>, res) => {
    try {
      const { Admin_id, Name, Location, Introduce } = req.body;
      await createTeam({
        Admin_id: Admin_id,
        Name: Name,
        Location: Location,
        Introduce: Introduce,
      });
      res.status(201).json({ result: "success" });
    } catch (err) {
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

module.exports = teamRouter;
