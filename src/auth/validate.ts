import { PrismaClient } from "@prisma/client";
import { Request } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { GenerateToken, AccessVerify, AccessRefresh } from "./token";
import {
  NotProvidedError,
  AccessTokenNotValidateError,
  RefreshTokenNotValidateError,
} from "./error";

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
    throw new NotProvidedError("Body");
  }

  const token = await prisma.oAuthToken.findFirst({
    where: {
      AccessToken: request.body.access_token,
    },
  });

  if (token) {
    if (AccessVerify(token.AccessToken)) {
      return { result: "success", User_id: token.User_id };
    } // A/T O
    if (!AccessVerify(token.AccessToken))
      throw new AccessTokenNotValidateError(); // A/T 만료
    if (!AccessVerify(token.RefreshToken))
      throw new RefreshTokenNotValidateError(); // A/T 만료 & R/T 만료

    if (isTokenValidMoreThanAWeek(token)) {
      const newToken = AccessRefresh(token.Auth_id);

      return { access_token: newToken.Access_Token, User_id: token.User_id };
    } else {
      const newToken = GenerateToken(token.Auth_id);

      return { access_token: newToken.Access_Token, User_id: token.User_id };
    }
  } else throw new NotProvidedError("Token");
}

export { Validation };
