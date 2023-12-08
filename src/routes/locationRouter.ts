import express from "express";
import { handleErrors } from "../ErrorHandler";
import { SetProfileLocation, SetTeamLocation } from "../Location/setLocation";

const locationRouter = express.Router();

locationRouter.get("/", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.slice(7);
    if (!req.headers.location) throw new Error();
    const result = await SetProfileLocation(req.headers?.location, token!!);
  } catch (err) {
    if (err instanceof Error) {
      handleErrors<Error>(err, res);
    }
  }
});
locationRouter.get("/:id", async (req, res) => {
  try {
    if (!req.headers.location) throw new Error();
    const result = await SetTeamLocation(+req.params.id, req.headers?.location);
  } catch (err) {
    if (err instanceof Error) {
      handleErrors<Error>(err, res);
    }
  }
});

export default locationRouter;
