import { PrismaClient } from "@prisma/client";
import Expo from "expo-server-sdk";
import { getToken } from "./pushNotification";
const prisma = new PrismaClient();
const expo = new Expo();
