import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";
import path from "path";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const httpServer = http.createServer(app);
import teamRouter from "./routes/teamRouter";
import authRouter from "./routes/authRouter";
import courtRouter from "./routes/courtRouter";
import alarmRouter from "./routes/alarmRouter";
import socketIOHandler from "./routes/chatRouter";
import matchRouter from "./routes/matchRouter";
import profileRouter from "./routes/profileRouter";
import imageRouter from "./routes/imageRouter";

const parentDirectory = path.join(__dirname, "../../");

app.use("/auth", authRouter);
app.use("/court", courtRouter);
app.use("/team", teamRouter);
app.use("/match", matchRouter);
app.use("/profile", profileRouter);
app.use("/image", imageRouter);
app.use(
  bodyParser.raw({
    type: "image/jpeg",
    limit: "10mb",
  }),
);

try {
  socketIOHandler(httpServer);
} catch (err) {
  if (err instanceof Error) {
    console.error(err);
  }
}
app.use("/team", teamRouter);
app.use("/notification", alarmRouter);

app.get("/", async (_req, res) => {
  try {
    res.json({ connect: "OK" });
  } catch (err) {
    res.json(err);
    return console.error(err);
  }
});

httpServer.listen(3010, () => {
  console.log("Server started on Port 3000");
});
