import express, { response } from "express";
import { LoginKakao, LoginGoogle } from "../auth/oAuth";
import { Login, Register } from "../auth/auth";
import { UserDelete } from "../auth/userDelete";
import { Validation } from "../auth/validate";

const authRouter = express.Router();

authRouter.post("/register", async (req, res) => {
  try {
    const result = await Register(req);
    res.status(201);
    res.send(result);
  } catch (err) {
    if (err instanceof Error) {
      res.status(400);
      console.log(err);
      res.send({ error: err.message });
    }
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const result = await Login(req);
    res.status(200);
    res.send(result);
  } catch (err) {
    if (err instanceof Error) {
      res.status(400);
      console.log(err);
      res.send({ error: err.message });
    }
  }
});

authRouter.get("/google/register", async (req, res) => {
  try {
    const result = await LoginGoogle(req.query.code);
    res.header("Access-Token", result.Token);
    res.end();
  } catch (err) {
    if (err instanceof Error) {
      res.status(400);
      console.log(err);
      res.send({ error: err.message });
    }
  }
});

authRouter.get("/kakao/register", async (req, res) => {
  try {
    const result = await LoginKakao(req.query.code);
    res.header("Access-Token", result.Token);
    res.end();
  } catch (err) {
    if (err instanceof Error) {
      res.status(400);
      console.log(err);
      res.send({ error: err.message });
    }
  }
});

authRouter.post("/validation", async (req, res) => {
  try {
    const result = await Validation(req);
    if (result?.access_token) res.status(201); //Created
    else res.status(200); //OK
    res.send(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message == "Token Expired") {
        res.status(401);
      } else res.status(400);
      console.log(err);
      res.send({ error: err.message });
    }
  }
});

authRouter.post("/delete", async (req, res) => {
  try {
    const result = await UserDelete(req);
    res.status(200);
    res.send(result);
  } catch (err) {
    if (err instanceof Error) {
      res.status(400);
      console.log(err);
      res.send({ error: err.message });
    }
  }
});

module.exports = authRouter;
