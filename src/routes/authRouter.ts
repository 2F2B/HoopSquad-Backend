import express, { response } from "express";
import { AuthResponse, SignupResponse } from "../auth/auth";
import axios from "axios";
import {
  gClientId,
  gClientSecret,
  gSignup_Redirect_uri,
  gToken_uri,
  gUserInfoUri,
} from "../GAuthKeys";
import { LoginKakao } from "../auth/kakaoAuth";

const authRouter = express.Router();

authRouter.get("/signup", (req, res) => {
  var url = SignupResponse();
  console.log(url);
  res.redirect(url);
});

authRouter.get("/login", (req, res) => {
  var url = AuthResponse();
  console.log(url);
  res.redirect(url);
});

authRouter.get("/signup/redirect", async (req, res) => {
  const { code } = req.query;
  console.log(`code: /${code}`);

  const resp = await axios.post(gToken_uri, {
    code,
    client_id: gClientId,
    client_secret: gClientSecret,
    redirect_uri: gSignup_Redirect_uri,
    grant_type: "authorization_code",
  });

  const resp2 = await axios.get(gUserInfoUri, {
    headers: {
      Authorization: `Bearer ${resp.data.access_token}`,
    },
  });
  res.json(resp2.data);
});

authRouter.get("/login/redirect", (req, res) => {
  const { code } = req.query;
  console.log(`code: /${code}`);
  res.send("ok");
});

authRouter.get("/register/kakao", async (req, res) => {
  try {
    const data = await LoginKakao(req.query.code);
    res.send(data);
  } catch (err) {
    res.status(400);
    res.send({ result: "error" });
  }
});

export default authRouter;
