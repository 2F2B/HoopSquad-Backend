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
import { LoginKakao } from "../auth/kakaoAuth";

const authRouter = express.Router();

authRouter.get("/register/google", (req, res) => {
  var url = SignupResponse();
  res.redirect(url);
});

authRouter.get("/login", (req, res) => {
  var url = LoginResponse();
  res.redirect(url);
});

authRouter.get("/register/redirect", async (req, res) => {
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

authRouter.get("/login/redirect", async (req, res) => {
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
    res.send(data);
  } catch (err) {
    res.status(400);
    res.send({ result: `error ${err}` });
  }
});

export default authRouter;
