import { PrismaClient } from "@prisma/client";
import { Request } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { GenerateToken, AccessVerify, AccessRefresh } from "./token";

const prisma = new PrismaClient();

function getCurrentTime() {
  return Math.floor(Date.now() / 1000);
}

async function Validation(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  if (request.body.access_token) {
    //req에 토큰 있음 -> 액세스 토큰 유효성 검사
    const tokenResult = await prisma.oAuthToken.findFirst({
      where: {
        AccessToken: request.body.access_token,
      },
    });
    if (tokenResult) {
      if (AccessVerify(tokenResult.AccessToken))
        //액세스 토큰 유효
        return { result: "success" };
      else if (
        AccessVerify(tokenResult.RefreshToken) //액세스 토큰은 만료되었으나 리프레시 토큰이 유효
      ) {
        if (
          // 리프레시 토큰의 유효기간 1주일 초과
          tokenResult.RToken_Expires + parseInt(tokenResult.RToken_CreatedAt) >
          604799
        ) {
          const newToken = AccessRefresh(tokenResult.Auth_id);

          await prisma.oAuthToken.updateMany({
            //새 토큰 발급 받아서 DB 갱신 후 토큰 반환
            where: {
              Auth_id: tokenResult.Auth_id,
            },
            data: {
              AccessToken: newToken.Access_Token,
              AToken_CreatedAt: newToken.AToken_CreatedAt,
              AToken_Expires: newToken.AToken_Expires,
            },
          });
          return { access_token: newToken.Access_Token };
        } else if (
          //리프레시 토큰의 유효기간 1주일 이하
          tokenResult.RToken_Expires + parseInt(tokenResult.RToken_CreatedAt) <=
          604799
        ) {
          const newTokens = GenerateToken(tokenResult.Auth_id);

          await prisma.oAuthToken.updateMany({
            //새로 발급받은 토큰들 DB 갱신, 반환
            where: {
              Auth_id: tokenResult.Auth_id.toString(),
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
          return { access_token: newTokens.Access_Token };
        }
      } else {
        //액세스 토큰과 리프레시 토큰 모두 만료
        return { result: "expired" };
      }
    } else return { result: "no_token" }; // req에 토근 없음
  } else return { result: "expired" }; //토큰이 없음
}

export { Validation };
