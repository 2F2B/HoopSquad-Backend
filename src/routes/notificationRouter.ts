import { handleErrors } from "../ErrorHandler";
import {
  checkGuestSignUp,
  checkHostApplyMatch,
  getPostingAlarm,
  signUpMatch,
} from "../alarm/alarm";
import { Request, Router } from "express";
import { removeToken, saveToken } from "../alarm/pushNotification";

const notificationRouter = Router();

notificationRouter.post(
  "/registerPushToken",
  async (req: Request<{}, {}, { userId: number; token: string }, {}>, res) => {
    try {
      const userId = String(req.body.userId);
      const token = String(req.body.token);
      await saveToken(userId, token);
      res.status(201).send({ result: "success" });
    } catch (err) {
      if (err instanceof Error) {
        handleErrors(err, res);
      }
    }
  },
);

notificationRouter.delete(
  "/removePushToken",
  async (req: Request<{}, {}, { userId: number }, {}>, res) => {
    try {
      await removeToken(String(req.body.userId));
      res.status(204).send();
    } catch (err) {
      if (err instanceof Error) {
        handleErrors(err, res);
      }
    }
  },
);

notificationRouter.get(
  "/matchSignUp",
  async (req: Request<{}, {}, {}, { roomId: number }>, res) => {
    try {
      const result = await checkGuestSignUp(+req.query.roomId);
      res.status(200).send({ result: result });
    } catch (err) {
      if (err instanceof Error) {
        handleErrors(err, res);
      }
    }
  },
);

notificationRouter.get(
  "/apply",
  async (req: Request<{}, {}, {}, { roomId: number }>, res) => {
    try {
      const result = await checkHostApplyMatch(+req.query.roomId);
      res.status(200).send({ result: result!! });
    } catch (err) {
      if (err instanceof Error) {
        handleErrors(err, res);
      }
    }
  },
);

notificationRouter.get("/match/:id", async (req, res) => {
  try {
    const result = await getPostingAlarm(+req.params.id);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof Error) {
      handleErrors(err, res);
    }
  }
});

notificationRouter.post(
  "/",
  async (
    req: Request<{}, {}, { postingId: number; roomId: number }, {}>,
    res,
  ) => {
    try {
      await signUpMatch(req.body.postingId, req.body.roomId);
      res.status(201).json({ result: "success" });
    } catch (err) {
      if (err instanceof Error) {
        handleErrors(err, res);
      }
    }
  },
);

export default notificationRouter;
