import express from "express";
import getTeam from "../team/teamSearch";
import { TeamNotFoundError } from "../team/error";
import { handleErrors } from "../ErrorHandler";

const teamRouter = express.Router();

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

module.exports = teamRouter;
