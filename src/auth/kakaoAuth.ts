import axios, { AxiosResponse } from "axios";
import { kakaoAPIKey } from "../apiKey";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function LoginKakao(code: any) {
  const token = await axios.post(
    "https://kauth.kakao.com/oauth/token",
    {
      grant_type: "authorization_code",
      client_id: kakaoAPIKey,
      redirect_uri: "http://localhost:3000/auth/kakao/register", //URL
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

  const isUserExist = await prisma.oAuthToken.findFirst({
    where: {
      Auth_id: user.data.id.toString(),
    },
  });

  const currentTimeInSecond = Math.floor(Date.now() / 1000);
  const expires_in = token.data.expires_in as number;
  const refresh_token_expires_in = token.data
    .refresh_token_expires_in as number;
  if (!isUserExist) {
    //유저 정보가 DB에 없음

    const result = await prisma.user.create({
      //유저 정보를 DB에 추가
      data: {
        Name: user.data.properties.nickname,
        OAuthToken: {
          create: {
            Auth_id: user.data.id.toString(),
            AccessToken: token.data.access_token,
            RefreshToken: token.data.refresh_token,
            AToken_Expires: expires_in,
            RToken_Expires: refresh_token_expires_in,
            CreatedAt: currentTimeInSecond.toString(),
          },
        },
      },
      include: {
        OAuthToken: true,
      },
    });
    return result.OAuthToken[0].AccessToken;
  } else {
    //유저 정보가 DB에 있음 -> 액세스 토큰과 리프레시 토큰을 새로 발급해서 DB에 갱신
    await prisma.oAuthToken.updateMany({
      where: {
        Auth_id: user.data.id.toString(),
      },
      data: {
        AccessToken: token.data.access_token,
        RefreshToken: token.data.refresh_token,
        AToken_Expires: expires_in,
        RToken_Expires: refresh_token_expires_in,
        CreatedAt: currentTimeInSecond.toString(),
      },
    });
    const result = await prisma.oAuthToken.findFirst({
      where: { Auth_id: user.data.id.toString() },
    });
    return result?.AccessToken!!;
  }
}

//TODO: 유효성 검사 구현

export { LoginKakao };
