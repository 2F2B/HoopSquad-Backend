import express from "express";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { Request } from "express";
import { ParsedQs } from "qs";
import { GenerateToken, AccessVerify, AccessRefresh } from "./token";

const prisma = new PrismaClient();

async function LoginGoogle( // 유저 코드 넘어옴
  code: String | ParsedQs | String[] | ParsedQs[] | undefined,
) {
  const res = await axios.post(`${process.env.gTokenUri}`, {
    // google에서 받은 코드를 통해 access 토큰 발급
    code,
    client_id: `${process.env.gClientId}`,
    client_secret: `${process.env.gClientSecret}`,
    redirect_uri: `${process.env.gSignupRedirectUri}`,
    // redirect_uri: "http://localhost:3000/auth/google/register", //test용 로컬 호스트
    grant_type: "authorization_code",
  });

  const user = await axios.get(`${process.env.gUserInfoUri}`, {
    // 발급받은 access 토큰으로 유저 데이터 요청
    headers: {
      Authorization: `Bearer ${res.data.access_token}`,
    },
  });

  const userData = {
    Auth_id: user.data.id,
  };

  const token = GenerateToken(JSON.stringify(userData)); // JWT 토큰 발행

  const isUserExist = await prisma.oAuthToken.findFirst({
    where: {
      Auth_id: user.data.id.toString(),
    },
  });

  if (!isUserExist) {
    // 유저 정보가 DB에 없으면  유저 정보 DB에 추가
    const result = await prisma.user.create({
      data: {
        Name: user.data.name,
        OAuthToken: {
          create: {
            Auth_id: user.data.id.toString(),
            AccessToken: token.Access_Token,
            RefreshToken: token.Refresh_Token,
            AToken_Expires: token.AToken_Expires,
            RToken_Expires: token.RToken_Expires,
            AToken_CreatedAt: token.AToken_CreatedAt,
            RToken_CreatedAt: token.RToken_CreatedAt,
          },
        },
      },
      include: {
        OAuthToken: true,
      },
    });
    return token.Access_Token;
  } else {
    //유저 정보가 DB에 있음 -> 액세스 토큰과 리프레시 토큰을 새로 발급해서 DB에 갱신
    await prisma.oAuthToken.updateMany({
      where: {
        Auth_id: user.data.id.toString(),
      },
      data: {
        AccessToken: token.Access_Token,
        RefreshToken: token.Refresh_Token,
        AToken_Expires: token.AToken_Expires,
        RToken_Expires: token.RToken_Expires,
        AToken_CreatedAt: token.AToken_CreatedAt,
        RToken_CreatedAt: token.RToken_CreatedAt,
      },
    });
    return token?.Access_Token!!;
  }
}

export { LoginGoogle };
