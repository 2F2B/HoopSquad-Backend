import express from "express";
import { LoginKakao, LoginGoogle } from "../auth/oAuth";
import { Login, Register } from "../auth/auth";
import { UserDelete } from "../auth/userDelete";
import { Validation } from "../auth/validate";
import {
  NotProvidedError,
  PasswordNotMatchError,
  UserAlreadyExistError,
  UserNotExistError,
} from "../auth/error";
import { handleErrors } from "../ErrorHandler";

const authRouter = express.Router();

authRouter.post("/register", async (req, res) => {
  try {
    const result = await Register(req);
    res.status(201);
    res.send(result);
  } catch (err) {
    if (err instanceof NotProvidedError) {
      handleErrors<NotProvidedError>(err, res);
    } else if (err instanceof UserAlreadyExistError) {
      handleErrors<UserAlreadyExistError>(err, res);
    } else if (err instanceof Error) {
      handleErrors<Error>(err, res);
    }
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const result = await Login(req);
    res.status(200);
    res.send(result);
  } catch (err) {
    if (err instanceof NotProvidedError) {
      handleErrors<NotProvidedError>(err, res);
    } else if (err instanceof UserNotExistError) {
      handleErrors<UserNotExistError>(err, res);
    } else if (err instanceof PasswordNotMatchError) {
      handleErrors<PasswordNotMatchError>(err, res);
    } else if (err instanceof Error) {
      handleErrors<Error>(err, res);
    }
  }
});

authRouter.get("/google/register", async (req, res) => {
  try {
    const result = await LoginGoogle(req.query.code);
    res.header("Authorization", `Bearer ${result.Token}`);
    res.header("User-Id", result.Id);
    res.status(200);
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
    res.header("User-Id", result.Id);
    res.status(200);
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
      res.status(400);
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

export default authRouter;
