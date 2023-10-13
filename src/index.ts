import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import db from "./database/auth_db";

const app = express();
db.connect();

app.use(cors());
app.use(bodyParser.json());

app.get("/", (_req, res) => {
  const sql = "SHOW TABLES";

  db.query(sql, (err, rows) => {
    if (err) {
      console.error(err);
      return res.json(rows);
    }
    res.json({ connect: "OK" });
  });
});

app.listen(3000, () => {
  console.log("Server started on Port 3000");
});
