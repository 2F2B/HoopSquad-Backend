import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { PrismaClient } from "@prisma/client";
const authRouter = require("./routes/authRouter");
const courtRouter = require("./routes/courtRouter");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(bodyParser.json());

app.use("/auth", authRouter);
app.use("/court", courtRouter);

app.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SHOW TABLES`;
    res.json({ connect: "OK" });
  } catch (err) {
    res.json(err);
    return console.error(err);
  }
});
app.listen(3000, () => {
  console.log("Server started on Port 3000");
});
