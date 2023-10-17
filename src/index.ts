import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { PrismaClient } from "@prisma/client";
import { AddressToLatLng, LatLngToAddress } from "./google-maps/googleMaps";

const prisma = new PrismaClient();

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SHOW TABLES`;
    res.send({ connect: "OK" });
  } catch (err) {
    res.json(err);
    return console.error(err);
  }
});

app.listen(3000, () => {
  console.log("Server started on Port 3000");
});
