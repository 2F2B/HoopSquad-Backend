import express from "express";
import { getUserProfile } from "../profile/User";

const profileRouter = express.Router();

profileRouter.get("/user/:id", async (req, res) => {
  try {
    const result = await getUserProfile(+req.params.id!!);
    if (!result) throw new Error("Profile Not Found");
    res.send(result);
  } catch (err) {
    res.status(400);
    console.error(err);
    res.send({ result: "error" });
  }
});

module.exports = profileRouter;
