import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const httpServer = http.createServer(app);

const authRouter = require("./routes/authRouter");
const courtRouter = require("./routes/courtRouter");
const { chatRouter, socketIOHandler } = require("./routes/chatRouter");
const matchRouter = require("./routes/matchRouter");

app.use("/auth", authRouter);
app.use("/court", courtRouter);
app.use("/chat", chatRouter);
app.use("/match", matchRouter);

socketIOHandler(httpServer);
app.use("/match", matchRouter);

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
