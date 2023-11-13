import express, { response } from "express";
import { LoginKakao, LoginGoogle } from "../auth/oAuth";
import { Login, Register } from "../auth/auth";
import { UserDelete } from "../auth/userDelete";
import { Validation } from "../auth/validate";

const authRouter = express.Router();

authRouter.post("/register", async (req, res) => {
  try {
    const result = await Register(req);
    res.send(result);
  } catch (err) {
    res.status(400);
    console.log(err);
    res.send({ result: "error" });
  }
});

authRouter.post("/login", async (req, res) => {
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
  try {
    const result = await LoginGoogle(req.query.code);
    res.header("Access-Token", result.Token);
    res.header("User-Id", result.Id);
    res.end();
  } catch (err) {
    res.status(400);
    console.error(err);
    res.send({ result: "error" });
  }
});

authRouter.get("/kakao/register", async (req, res) => {
  try {
    const result = await LoginKakao(req.query.code);
    res.header("Access-Token", result.Token);
    res.header("User-Id", result.Id);
    res.end();
  } catch (err) {
    res.status(400);
    console.error(err);
    res.send({ result: "error" });
  }
});

authRouter.post("/validation", async (req, res) => {
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

authRouter.post("/delete", async (req, res) => {
  try {
    const result = await UserDelete(req);
    res.send(result);
  } catch (err) {}
});

module.exports = authRouter;
