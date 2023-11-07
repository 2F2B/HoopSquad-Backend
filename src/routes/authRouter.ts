import express, { response } from "express";
import { SignupResponse, LoginGoogle, ValidateGoogle } from "../auth/auth";
import { LoginKakao, ValidateKakao } from "../auth/kakaoAuth";
import { UserDelete } from "../auth/userDelete";

const authRouter = express.Router();

authRouter.get("/google/register", (req, res) => {
  var url = SignupResponse();
  res.redirect(url);
});

authRouter.get("/google/redirect", async (req, res) => {
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

authRouter.post("/google/validation", async (req, res) => {
  try {
    const result = await ValidateGoogle(req);
    if (result.access_token) res.status(201); //Created
    else if (result.result == "expired") res.status(401); //Unauthorized
    else if (result.result == "no_token") res.status(400); //Bad Request
    else res.status(200); //OK
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
    if (result.access_token) res.status(201); //Created
    else if (result.result == "expired") res.status(401); //Unauthorized
    else if (result.result == "no_token") res.status(400); //Bad Request
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
