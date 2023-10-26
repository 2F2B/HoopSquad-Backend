import express, { response } from "express";
import {
  LoginResponse,
  SignupResponse,
  LoginGoogle,
  ValidateGoogle,
} from "../auth/auth";
import axios from "axios";
import { LoginKakao, ValidateKakao } from "../auth/kakaoAuth";

const authRouter = express.Router();

authRouter.get("/google/register", (req, res) => {
  var url = SignupResponse();
  res.redirect(url);
});

authRouter.get("/google/login", (req, res) => {
  var url = LoginResponse();
  res.redirect(url);
});

authRouter.get("/google/reg_redirect", async (req, res) => {
  const { code } = req.query;
  console.log(`reg_redirect`);
  try {
    const Token = await LoginGoogle(code);
    res.send(`Register Success \n ${Token}`);
  } catch (err) {
    res.status(400);
    console.error(err);
    res.send({ result: "error" });
  }
});

authRouter.post("/google/validation", async (req, res) => {
  try {
    const result = await ValidateGoogle(req);
    res.send(result);
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

authRouter.post("/kakao/validation", async (req, res) => {
  try {
    const result = await ValidateKakao(req);
    res.send(result);
  } catch (err) {
    res.status(400);
    console.error(err);
    res.send({ result: "error" });
  }
});

module.exports = authRouter;
