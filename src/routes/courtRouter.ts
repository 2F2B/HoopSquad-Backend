import express from "express";
import { getCourt, addCourt } from "../court/court";
const courtRouter = express.Router();

courtRouter.get("/", async (req, res) => {
  try {
    let result;
    if (req.query.id) {
      //쿼리 문자열 있음
      if (typeof req.query.id === "string") {
        result = await getCourt(parseInt(req.query.id));
        res.json(result);
      }
    } else {
      //쿼리 문자열 없음
      result = await getCourt();
      res.json(result);
    }
  } catch (err) {
    res.status(400);
    res.json({ result: "error" });
  }
});

courtRouter.post("/", async (req, res) => {
  const result = await addCourt(req.body);
  res.status(result.Code);
  res.json(result);
});

module.exports = courtRouter;
