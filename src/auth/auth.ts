import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { Request } from "express";
import { ParsedQs } from "qs";
import { GenerateToken, AccessVerify, AccessRefresh } from "./token";

const prisma = new PrismaClient();

function NameGen(): string {
  const rand = Math.floor(Math.random() * (999999 - 0)) + 0;
  const name = "user-" + rand.toString();
  return name;
}

async function Register(
  req: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  if (req.body.Email == undefined) return { result: "error" };
  const isExist = await prisma.userData.findFirst({
    // 유저가 이미 가입했는지 확인
    where: { Email: req.body.Email },
  });
  if (isExist) return { result: "isUser" }; //가입 유저
  // 미가입 유저
  const newUser = await prisma.user.create({
    data: {
      Name: NameGen(),
      UserData: {
        create: {
          Email: req.body.Email,
          Password: req.body.Password,
        },
      },
    },
  });
  const newToken = await GenerateToken(
    JSON.stringify({ Auth_id: newUser.User_id }),
  );

  await prisma.oAuthToken.create({
    data: {
      User_id: newUser.User_id,
      AccessToken: newToken.Access_Token,
      RefreshToken: newToken.Refresh_Token,
      AToken_Expires: newToken.AToken_Expires,
      RToken_Expires: newToken.RToken_Expires,
      AToken_CreatedAt: newToken.AToken_CreatedAt,
      RToken_CreatedAt: newToken.RToken_CreatedAt,
      Auth_id: newUser.User_id.toString(),
    },
  });
  return { token: newToken.Access_Token };
}

async function Login(
  req: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  if (req.body.Email == undefined) return { result: "error" };
  const isExist = await prisma.userData.findFirst({
    where: {
      Email: req.body.Email,
    },
  });
  if (!isExist) return { result: "notUser" }; // DB에 유저 없음
  if (isExist.Password != req.body.Password) return { result: "PasswordError" };
  // DB에 유저 있음
  const newToken = await GenerateToken(
    JSON.stringify({ Auth_id: isExist.User_id }),
  );
  await prisma.oAuthToken.create({
    data: {
      User_id: isExist.User_id,
      AccessToken: newToken.Access_Token,
      RefreshToken: newToken.Refresh_Token,
      AToken_Expires: newToken.AToken_Expires,
      RToken_Expires: newToken.RToken_Expires,
      AToken_CreatedAt: newToken.AToken_CreatedAt,
      RToken_CreatedAt: newToken.RToken_CreatedAt,
      Auth_id: isExist.User_id.toString(),
    },
  });
  return { token: newToken.Access_Token };
}
export { Register, Login };
