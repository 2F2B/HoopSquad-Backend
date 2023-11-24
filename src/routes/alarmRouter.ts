import express from "express";
import { applyMatch, getAlarm } from "../alarm/alarm";

const alarmRouter = express.Router();

alarmRouter.get("/:id", async (req, res) => {
  try {
    const result = await getAlarm(+req.params.id);
    res.json(result);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.json({ error: err.message });
    }
  }
});

alarmRouter.post("/match", async (req, res) => {
  try {
    await applyMatch(req.body);
    res.json({ result: "success" });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.json({ error: err.message });
    }
  }
});

module.exports = alarmRouter;
