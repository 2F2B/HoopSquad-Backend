import express from "express";
import getTeam from "../team/teamSearch";

const teamRouter = express.Router();

teamRouter.get("/", async (_req, res) => {
  try {
    const result = await getTeam();
    res.status(200);
    res.json(result);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(400);
      res.json({ error: err.message });
    }
  }
});

teamRouter.get("/:id", async (req, res) => {
  try {
    const result = await getTeam(+req.params.id);
    res.status(200);
    res.json(result);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(400);
      res.json({ error: err.message });
    }
  }
});

module.exports = teamRouter;
