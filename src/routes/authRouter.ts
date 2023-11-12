import express, { response } from "express";
import { LoginKakao, LoginGoogle } from "../auth/oAuth";
import { Login, Register } from "../auth/auth";
import { UserDelete } from "../auth/userDelete";
import { Validation } from "../auth/validate";

const authRouter = express.Router();

authRouter.get("/register", async (req, res) => {
  try {
    const result = await Register(req);
    res.send(result);
  } catch (err) {
    res.status(400);
    console.log(err);
    res.send({ result: "error" });
  }
});

authRouter.get("/login", async (req, res) => {
  try {
    const result = await Login(req);
    res.send(result);
  } catch (err) {
    res.status(400);
    console.log(err);
    res.send({ result: "error" });
  }
});

authRouter.get("/google/register", async (req, res) => {
  const { code } = req.query;
  console.log(code);
  try {
    const Token = await LoginGoogle(code);
    res.send({ token: Token });
  } catch (err) {
    res.status(400);
    console.error(err);
    res.send({ result: "error" });
  }
});

authRouter.get("/kakao/register", async (req, res) => {
  try {
    console.log(req.query.code);
    const data = await LoginKakao(req.query.code);
    res.send({ token: data });
  } catch (err) {
    res.status(400);
    console.error(err);
    res.send({ result: "error" });
  }
});

authRouter.get("/validation", async (req, res) => {
  try {
    const result = await Validation(req);
    if (result?.access_token) res.status(201); //Created
    else if (result?.result == "expired") res.status(401); //Unauthorized
    else if (result?.result == "no_token") res.status(400); //Bad Request
    else res.status(200); //OK
    res.send(result);
  } catch (err) {
    res.status(400);
    console.error(err);
    res.send({ result: "error" });
  }
});

authRouter.get("/delete", async (req, res) => {
  try {
    const result = await UserDelete(req);
    res.send(result);
  } catch (err) {}
});

module.exports = authRouter;
