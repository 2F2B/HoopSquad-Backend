import { handleErrors } from "../ErrorHandler";
import {
  getPostingAlarm,
  applyMatch,
  updateIsRead,
  deleteAllNotification,
  deleteNotification,
  createNotification,
} from "../alarm/alarm";
import { Request, Router } from "express";
import * as FirebaseService from "./notificationRouter";

const notificationRouter = Router();

notificationRouter.post("/registerPushToken", async (req, res) => {
  const userId = String(req.body.userId);
  const token = String(req.body.token);
  await FirebaseService.saveToken(userId, token);
  res.status(200).send({ result: "success" });
});

notificationRouter.get("/:id", async (req, res) => {
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
    req: Request<{}, {}, { postingId: number; isApply: boolean }, {}>,
    res,
  ) => {
    try {
      await applyMatch(req.body.postingId, req.body.isApply);
      res.status(200).json({ result: "success" });
    } catch (err) {
      if (err instanceof Error) {
        handleErrors(err, res);
      }
    }
  },
);

notificationRouter.patch("/:id", async (req, res) => {
  try {
    await updateIsRead(+req.params.id);
    res.status(200).json({ result: "success" });
  } catch (err) {
    if (err instanceof Error) {
      handleErrors(err, res);
    }
  }
});

notificationRouter.post(
  "/",
  async (
    req: Request<
      {},
      {},
      { postingId: number; userId: number; opponentId: number },
      {}
    >,
    res,
  ) => {
    try {
      await createNotification(
        req.body.postingId,
        req.body.userId,
        req.body.opponentId,
      );
      res.status(201).json({ result: "success" });
    } catch (err) {
      if (err instanceof Error) {
        handleErrors(err, res);
      }
    }
  },
);

notificationRouter.delete("/:id", async (req, res) => {
  try {
    await deleteAllNotification(+req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err instanceof Error) {
      handleErrors(err, res);
    }
  }
});

notificationRouter.delete(
  "/",
  async (
    req: Request<{}, {}, {}, { user_id: number; posting_id: number }>,
    res,
  ) => {
    try {
      await deleteNotification(req.query.user_id, req.query.posting_id);
    } catch (err) {
      if (err instanceof Error) {
        handleErrors(err, res);
      }
    }
  },
);

export default notificationRouter;
