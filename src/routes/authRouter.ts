import express from "express";
import { LoginKakao } from "../auth/auth";

const authRouter = express.Router();
authRouter.get("/register", async (req, res) => {
  try {
    const data = await LoginKakao(req.query.code);
    res.send(data);
  } catch (err) {
    res.status(400);
    res.send({ result: "error" });
  }
});

export default authRouter;
