import express from "express";
import { getCourt, addCourt } from "../court/court";
const courtRouter = express.Router();

courtRouter.get("/", async (_req, res) => {
  try {
    const result = await getCourt();
    res.json(result);
  } catch (err) {
    if (err instanceof Error) {
      res.status(400);
      console.error(err);
      res.json({ error: err.message });
    }
  }
});

courtRouter.get("/:id", async (req, res) => {
  try {
    const result = await getCourt(+req.params.id);
    res.json(result);
  } catch (err) {
    if (err instanceof Error) {
      res.status(400);
      console.error(err);
      res.json({ error: err.message });
    }
  }
});

courtRouter.post("/", async (req, res) => {
  try {
    const result = await addCourt(req.body);
    res.json(result);
  } catch (err) {
    if (err instanceof Error) {
      res.status(400);
      res.json({ error: err.message });
    }
  }
});

module.exports = courtRouter;
