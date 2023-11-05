import express from "express";
import { applyMatch, getAlarm } from "../alarm/alarm";

const alarmRouter = express.Router();

alarmRouter.get("/:id", async (req, res) => {
  try {
    const result = await getAlarm(+req.params.id);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(403);
    res.json({ result: "error" });
  }
});

alarmRouter.post("/match", async (req, res) => {
  try {
    await applyMatch(req.body);
    res.json({ result: "success" });
  } catch (err) {
    console.error(err);
    res.status(403);
    res.json({ result: "error" });
  }
});

module.exports = alarmRouter;
