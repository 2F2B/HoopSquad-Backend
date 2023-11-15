import { PrismaClient } from "@prisma/client";
import { Request } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { GenerateToken, AccessVerify, AccessRefresh } from "./token";

const prisma = new PrismaClient();

const oneWeekInSeconds = 604799;

type Token = {
  id: number;
  User_id: number;
  AccessToken: string;
  RefreshToken: string;
  AToken_CreatedAt: string;
  RToken_CreatedAt: string;
  AToken_Expires: number;
  RToken_Expires: number;
  Auth_id: string;
};

function isTokenValidMoreThanAWeek(token: Token) {
  if (
    token.RToken_Expires + parseInt(token.RToken_CreatedAt) >
    oneWeekInSeconds
  )
    return true;
  else return false;
}

async function Validation(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  if (!request.body.access_token) {
    // A/T 가 안넘어옴
    throw new Error("Body Not Exist");
  }

  const token = await prisma.oAuthToken.findFirst({
    where: {
      AccessToken: request.body.access_token,
    },
  });

  if (!token) throw new Error("Token Not Exist");

  if (AccessVerify(token.AccessToken)) {
    return { result: "success", User_id: token.User_id };
  } // A/T O
  if (!AccessVerify(token.RefreshToken)) throw new Error("Token Expired"); // A/T X, R/T X

  if (isTokenValidMoreThanAWeek(token)) {
    const newToken = AccessRefresh(token.Auth_id);

    await prisma.oAuthToken.updateMany({
      where: {
        Auth_id: token.Auth_id,
      },
      data: {
        AccessToken: newToken.Access_Token,
        AToken_CreatedAt: newToken.AToken_CreatedAt,
        AToken_Expires: newToken.AToken_Expires,
      },
    });

    return { access_token: newToken.Access_Token, User_id: token.User_id };
  } else {
    const newTokens = GenerateToken(token.Auth_id);

    await prisma.oAuthToken.updateMany({
      where: {
        Auth_id: token.Auth_id,
      },
      data: {
        AccessToken: newTokens.Access_Token,
        RefreshToken: newTokens.Refresh_Token,
        AToken_Expires: newTokens.AToken_Expires,
        RToken_Expires: newTokens.RToken_Expires,
        AToken_CreatedAt: newTokens.AToken_CreatedAt,
        RToken_CreatedAt: newTokens.RToken_CreatedAt,
      },
    });

    return { access_token: newTokens.Access_Token, User_id: token.User_id };
  }
}

export { Validation };
