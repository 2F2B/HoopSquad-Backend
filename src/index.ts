import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
const authRouter = require("./routes/authRouter");
const courtRouter = require("./routes/courtRouter");
const teamRouter = require("./routes/teamRouter");

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use("/auth", authRouter);
app.use("/court", courtRouter);
app.use("/team", teamRouter);

app.get("/", async (_req, res) => {
  try {
    res.json({ connect: "OK" });
  } catch (err) {
    res.json(err);
    return console.error(err);
  }
});
app.listen(3000, () => {
  console.log("Server started on Port 3000");
});
