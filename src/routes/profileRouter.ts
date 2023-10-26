import express, { response } from "express";
import axios from "axios";
import { PrismaClient } from "@prisma/client";

const profileRouter = express.Router();
const prisma = new PrismaClient();

profileRouter.get("/info", async (req, res) => {
  const userinfo = await prisma.oAuthToken.findFirst({
    where: {
      AccessToken: req.body.access_token,
    },
  });
});
