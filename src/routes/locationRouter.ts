import express from "express";
import { handleErrors } from "../ErrorHandler";
import { SetProfileLocation, SetTeamLocation } from "../Location/setLocation";

const locationRouter = express.Router();

locationRouter.post("/", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.slice(7);
    if (!req.body.Location) throw new Error();
    const result = await SetProfileLocation(req.body.Location, token!!);
    res.status(201);
    res.send();
  } catch (err) {
    if (err instanceof Error) {
      handleErrors<Error>(err, res);
    }
  }
});
locationRouter.post("/:id", async (req, res) => {
  try {
    if (!req.body.Location) throw new Error();
    const result = await SetTeamLocation(+req.params.id, req.body.Location);
  } catch (err) {
    if (err instanceof Error) {
      handleErrors<Error>(err, res);
    }
  }
});

export default locationRouter;
