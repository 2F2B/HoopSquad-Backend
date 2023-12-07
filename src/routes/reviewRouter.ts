import express from "express";
import { getWeather } from "../weather/weather";
import { getMatchPlayers, setUserReview } from "../review/review";
import { handleErrors } from "../ErrorHandler";
import { NotFoundError } from "../review/error";

const reviewRouter = express.Router();
export interface CreateReviewType {
  Player_id: number;
  isPositive: boolean;
  Comment: string;
}

reviewRouter.get("/:id", async (req, res) => {
  try {
    const result = await getMatchPlayers(+req.params.id);
    res.status(200);
    res.send(result);
  } catch (err) {
    if (err instanceof NotFoundError) {
      handleErrors<NotFoundError>(err, res);
    } else if (err instanceof Error) {
      handleErrors<Error>(err, res);
    }
  }
});

reviewRouter.post("/", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.slice(7);
    const result = setUserReview(req.body);
    res.status(201);
    res.send(req.body);
  } catch (err) {
    if (err instanceof Error) {
      handleErrors<Error>(err, res);
    }
  },
);

export default reviewRouter;
