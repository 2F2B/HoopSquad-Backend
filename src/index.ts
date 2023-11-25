import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";
import path from "path";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const httpServer = http.createServer(app);
const teamRouter = require("./routes/teamRouter");
const authRouter = require("./routes/authRouter");
const courtRouter = require("./routes/courtRouter");
const alarmRouter = require("./routes/alarmRouter");
const { socketIOHandler } = require("./routes/chatRouter");
const matchRouter = require("./routes/matchRouter");
const profileRouter = require("./routes/profileRouter");

const parentDirectory = path.join(__dirname, "../../");

app.use("/auth", authRouter);
app.use("/court", courtRouter);
app.use("/team", teamRouter);
app.use("/match", matchRouter);
app.use("/profile", profileRouter);
app.use("/uploads", express.static(path.join(parentDirectory, "uploads")));
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

httpServer.listen(3000, () => {
  console.log("Server started on Port 3000");
});
