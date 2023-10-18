import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { PrismaClient } from "@prisma/client";
import { getCourt, addCourt } from "./court/court";

const app = express();
const prisma = new PrismaClient();

const routes = require("./routes");

app.use("/", routes);
app.use(cors());
app.use(bodyParser.json());

app.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SHOW TABLES`;
    res.json({ connect: "OK" });
  } catch (err) {
    res.json(err);
    return console.error(err);
  }
});

app.get("/api/court", async (req, res) => {
  let result;
  if (req.query.id) {
    //쿼리 문자열 있음
    if (typeof req.query.id === "string") {
      result = await getCourt(parseInt(req.query.id));
      res.json(result);
    }
  } else {
    //쿼리 문자열 없음
    result = await getCourt();
    res.json(result);
  }
});

app.post("/api/court/add", async (req, res) => {
  const result = await addCourt(req.body);
  res.json(result);
});

app.listen(3000, () => {
  console.log("Server started on Port 3000");
});
