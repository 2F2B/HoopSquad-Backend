import express from "express";
import Response from "../auth/auth";

const authRouter = express.Router();
authRouter.use("/", (req, res) => {
  res.send(Response());
});

export default authRouter;
