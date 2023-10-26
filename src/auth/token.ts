import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

function getCurrentTime() {
  return Math.floor(Date.now() / 1000);
}

function GenerateToken(UserData: any) {
  const data = JSON.parse(UserData);

  const Access_Token = jwt.sign(data, process.env.SECRET_KEY!!, {
    expiresIn: "2h",
    algorithm: "HS256",
  });

  const Refresh_Token = jwt.sign(data, process.env.SECRET_KEY!!, {
    expiresIn: "14d",
    algorithm: "HS256",
  });

  const res = {
    Access_Token: Access_Token,
    AToken_Expires: 7199,
    AToken_CreatedAt: getCurrentTime().toString(),
    Refresh_Token: Refresh_Token,
    RToken_Expires: 1209599, // 14일
    RToken_CreatedAt: getCurrentTime().toString(),
  };

  return res;
}

function AccessVerify(token: string) {
  try {
    jwt.verify(token, process.env.SECRET_KEY!!);
    return true;
  } catch (err) {
    return false;
  }
}

function AccessRefresh(UserData: any) {
  const data = JSON.parse(UserData);

  const Access_Token = jwt.sign(data, process.env.SECRET_KEY!!, {
    expiresIn: "2h",
  });
  const res = {
    Access_Token: Access_Token,
    AToken_Expires: 7199,
    AToken_CreatedAt: getCurrentTime().toString(),
  };
  return res;
}

export { GenerateToken, AccessVerify, AccessRefresh };
