import express from "express";
import getTeam from "../team/teamSearch";

const teamRouter = express.Router();

teamRouter.get("/list", async (req, res) => {
  if (typeof req.query.team_id === "string") {
    const result = await getTeam(parseInt(req.query.team_id));
    res.status(200);
    res.json(result);
  } else {
    const result = await getTeam();
    res.status(200);
    res.json(result);
  }
});

module.exports = teamRouter;
