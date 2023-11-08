import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { Request } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { GenerateToken, AccessVerify, AccessRefresh } from "./token";

const prisma = new PrismaClient();
function getCurrentTime() {
  return Math.floor(Date.now() / 1000);
}

async function LoginKakao(code: any) {
  const token = await axios.post(
    "https://kauth.kakao.com/oauth/token",
    {
      grant_type: "authorization_code",
      client_id: `${process.env.kakaoAPIKey}`,
      redirect_uri: "https://hoopsquad.link/auth/kakao/register", //URL
      // redirect_uri: "http://localhost:3000/auth/kakao/register", // 테스트용 localhost
      code: code,
    },
    {
      headers: {
        "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    },
  ); //발급된 인가 코드로 토큰 발급

  const user = await axios.get("https://kapi.kakao.com/v2/user/me", {
    headers: {
      Authorization: `Bearer ${token.data.access_token}`,
      "Content-Type":
        "	Content-type: application/x-www-form-urlencoded;charset=utf-8",
    },
  }); //발급된 토큰을 가진 유저의 정보 요청

  const userData = {
    Auth_id: user.data.id,
  };

  const newToken = GenerateToken(JSON.stringify(userData)); // JWT 토큰 발행

  const isUserExist = await prisma.oAuthToken.findFirst({
    where: {
      Auth_id: user.data.id.toString(),
    },
  });

  if (!isUserExist) {
    //유저 정보가 DB에 없음

    const result = await prisma.user.create({
      //유저 정보를 DB에 추가
      data: {
        Name: user.data.properties.nickname,
        OAuthToken: {
          create: {
            Auth_id: user.data.id.toString(),
            AccessToken: newToken.Access_Token,
            RefreshToken: newToken.Refresh_Token,
            AToken_Expires: newToken.AToken_Expires,
            RToken_Expires: newToken.RToken_Expires,
            AToken_CreatedAt: newToken.AToken_CreatedAt,
            RToken_CreatedAt: newToken.RToken_CreatedAt,
          },
        },
      },
      include: {
        OAuthToken: true,
      },
    });
    return newToken.Access_Token;
  } else {
    //유저 정보가 DB에 있음 -> 액세스 토큰과 리프레시 토큰을 새로 발급해서 DB에 갱신
    await prisma.oAuthToken.updateMany({
      where: {
        Auth_id: user.data.id.toString(),
      },
      data: {
        AccessToken: newToken.Access_Token,
        RefreshToken: newToken.Refresh_Token,
        AToken_Expires: newToken.AToken_Expires,
        RToken_Expires: newToken.RToken_Expires,
        AToken_CreatedAt: newToken.AToken_CreatedAt,
        RToken_CreatedAt: newToken.RToken_CreatedAt,
      },
    });
    return newToken?.Access_Token!!;
  }
}

export { LoginKakao };
