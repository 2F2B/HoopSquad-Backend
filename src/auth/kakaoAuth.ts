import axios from "axios";
import { kakaoAPIKey } from "../apiKey";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function LoginKakao(code: any) {
  const token = await axios.post(
    "https://kauth.kakao.com/oauth/token",
    {
      grant_type: "authorization_code",
      client_id: kakaoAPIKey,
      redirect_uri: "http://localhost:3000/auth/register/kakao",
      code: code,
    },
    {
      headers: {
        "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    },
  );

  const user = await axios.get("https://kapi.kakao.com/v2/user/me", {
    headers: {
      Authorization: `Bearer ${token.data.access_token}`,
      "Content-Type":
        "	Content-type: application/x-www-form-urlencoded;charset=utf-8",
    },
  });

  const isUserExist = await prisma.oAuthToken.findFirst({
    where: {
      Auth_id: user.data.id.toString(),
    },
  });
  const currentTimeInSecond = Math.floor(Date.now() / 1000);
  if (!isUserExist) {
    //유저 정보가 DB에 없음
    const expires_in = token.data.expires_in as number;
    const refresh_token_expires_in = token.data
      .refresh_token_expires_in as number;

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
    return result;
  } else {
    //유저 정보가 DB에 있음
    if (
      isUserExist.AToken_Expires + parseInt(isUserExist.CreatedAt) <
      currentTimeInSecond
    ) {
      //토큰 만료
      return { token: "Expired" };
      //TODO: 리프레시 토큰 발급
    } else return isUserExist; //TODO: 로그인 승인
  }
}

export { LoginKakao };
