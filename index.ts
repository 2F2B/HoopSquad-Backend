import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get("/", (_req, res) => {
  res.json({ result: "OK!!!" });
});

app.listen(3000, () => {
  console.log("Server started on Port 3000");
});
