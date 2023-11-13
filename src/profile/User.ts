import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { Request } from "express";
import { ParsedQs } from "qs";

const prisma = new PrismaClient();

async function getUserProfile(userId: number) {
  const Profile = await prisma.profile.findFirst({
    where: {
      User_id: userId,
    },
  });
  return Profile;
}

export { getUserProfile };
