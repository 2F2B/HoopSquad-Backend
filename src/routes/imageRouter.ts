import express from "express";
import path from "path";

const parentDirectory = path.join(__dirname, "../../..");
const imageDirectory = path.join(parentDirectory, "image");
const imageRouter = express.Router();

imageRouter.use("/match", express.static(path.join(imageDirectory, "match")));
imageRouter.use("/user", express.static(path.join(imageDirectory, "user")));
imageRouter.use("/team", express.static(path.join(imageDirectory, "team")));

module.exports = imageRouter;
