import express from "express";
import { getUserProfile, setUserProfile } from "../profile/User";

const profileRouter = express.Router();

profileRouter.get("/user/:id", async (req, res) => {
  try {
    const result = await getUserProfile(+req.params.id!!);
    if (!result) throw new Error("Profile Not Found");
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

profileRouter.post("/user", async (req, res) => {
  try {
    if (!req.body) throw new Error("Body Not Exists");
    const result = await setUserProfile(req);
    if (!result) throw new Error("Profile Not Found");
    res.status(201);
    res.send(result);
  } catch (err) {
    if (err instanceof Error) {
      res.status(401);
      console.log(err);
      res.send({ error: err.message });
    }
  }
});

module.exports = profileRouter;
