import { handleErrors } from "../ErrorHandler";
import {
  getPostingAlarm,
  applyMatch,
  createNotification,
} from "../alarm/alarm";
import { Request, Router } from "express";
import * as FirebaseService from "../alarm/pushNotification";

const notificationRouter = Router();

notificationRouter.post(
  "/registerPushToken",
  async (req: Request<{}, {}, { userId: number; token: string }, {}>, res) => {
    try {
      const userId = String(req.body.userId);
      const token = String(req.body.token);
      await FirebaseService.saveToken(userId, token);
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
      await FirebaseService.removeToken(String(req.body.userId));
      res.status(204).send();
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

notificationRouter.patch(
  "/match",
  async (
    req: Request<
      {},
      {},
      { postingId: number; guestId: number; isApply: boolean },
      {}
    >,
    res,
  ) => {
    try {
      await applyMatch(req.body.postingId, req.body.guestId, req.body.isApply);
      res.status(200).json({ result: "success" });
    } catch (err) {
      if (err instanceof Error) {
        handleErrors(err, res);
      }
    }
  },
);

notificationRouter.post(
  "/",
  async (
    req: Request<
      {},
      {},
      { postingId: number; hostId: number; guestId: number },
      {}
    >,
    res,
  ) => {
    try {
      await createNotification(
        req.body.postingId,
        req.body.hostId,
        req.body.guestId,
      );
      res.status(201).json({ result: "success" });
    } catch (err) {
      if (err instanceof Error) {
        handleErrors(err, res);
      }
    }
  },
);

export default notificationRouter;
