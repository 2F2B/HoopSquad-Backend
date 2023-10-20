import express, { response } from "express";
import { LoginResponse, SignupResponse } from "../auth/auth";
import axios from "axios";
import {
  gClientId,
  gClientSecret,
  gLoginRedirectUri,
  gSignup_Redirect_uri,
  gToken_uri,
  gUserInfoUri,
} from "../GAuthKeys";
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
  console.log(`register code: /${code}`);

  const resp = await axios.post(gToken_uri, {
    code,
    client_id: gClientId,
    client_secret: gClientSecret,
    redirect_uri: gSignup_Redirect_uri,
    grant_type: "authorization_code",
  });
  console.log(resp.data);
  const resp2 = await axios.get(gUserInfoUri, {
    headers: {
      Authorization: `Bearer ${resp.data.access_token}`,
    },
  });
  res.json(resp2.data);
});

authRouter.get("/google/in_direct", async (req, res) => {
  const { code } = req.query;
  console.log(`login code: /${code}`);

  const resp = await axios.post(gToken_uri, {
    code,
    client_id: gClientId,
    client_secret: gClientSecret,
    redirect_uri: gLoginRedirectUri,
    grant_type: "authorization_code",
  });
  console.log(resp.data);

  res.send("ok");
});

authRouter.get("/kakao/register", async (req, res) => {
  try {
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
