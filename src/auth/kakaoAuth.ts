import axios, { AxiosResponse } from "axios";
import { RESTAPIKey, kakaoAPIKey } from "../apiKey";
import { PrismaClient } from "@prisma/client";
import { Request } from "express-serve-static-core";
import { ParsedQs } from "qs";

const prisma = new PrismaClient();
const currentTimeInSecond = Math.floor(Date.now() / 1000);

async function LoginKakao(code: any) {
  const token = await axios.post(
    "https://kauth.kakao.com/oauth/token",
    {
      grant_type: "authorization_code",
      client_id: kakaoAPIKey,
      redirect_uri:
        "http://ec2-52-79-227-4.ap-northeast-2.compute.amazonaws.com/auth/kakao/register", //URL
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
            AToken_CreatedAt: currentTimeInSecond.toString(),
            RToken_CreatedAt: currentTimeInSecond.toString(),
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
        AToken_CreatedAt: currentTimeInSecond.toString(),
        RToken_CreatedAt: currentTimeInSecond.toString(),
      },
    });
    const result = await prisma.oAuthToken.findFirst({
      where: { Auth_id: user.data.id.toString() },
    });
    return result?.AccessToken!!;
  }
}

//TODO: 유효성 검사 구현

async function ValidateKakao(
  request: Request<{}, any, any, ParsedQs, Record<string, any>>,
) {
  if (request.body.access_token) {
    //토큰 있음 -> 액세스 토큰 유효성 검사
    const tokenResult = await prisma.oAuthToken.findFirst({
      where: {
        AccessToken: request.body.access_token,
      },
    });
    if (tokenResult) {
      if (
        tokenResult.AToken_Expires + parseInt(tokenResult.AToken_CreatedAt) >
        currentTimeInSecond //액세스 토큰 유효
      )
        return { result: "success" };
      else if (
        tokenResult.RToken_Expires + parseInt(tokenResult.RToken_CreatedAt) >
        currentTimeInSecond //액세스 토큰은 만료되었으나 리프레시 토큰이 유효
      ) {
        console.log("Access Token Expired");
        const newToken = await axios.post(
          "https://kauth.kakao.com/oauth/token",
          {
            grant_type: "refresh_token",
            client_id: RESTAPIKey,
            refresh_token: tokenResult.RefreshToken,
          },
          {
            headers: {
              "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
            },
          },
        );

        if (newToken.data.refresh_token) {
          //리프레시 토큰의 유효기간이 얼마 남지 않아 리프레시 토큰이 발급됨
          await prisma.oAuthToken.updateMany({
            where: {
              Auth_id: tokenResult.Auth_id,
            },
            data: {
              RefreshToken: newToken.data.refresh_token,
              RToken_Expires: newToken.data.refresh_token_expires_in,
              RToken_CreatedAt: currentTimeInSecond.toString(),
              AToken_CreatedAt: currentTimeInSecond.toString(),
            },
          });
        }

        await prisma.oAuthToken.updateMany({
          //액세스 토큰 갱신
          where: {
            Auth_id: tokenResult.Auth_id,
          },
          data: {
            AccessToken: newToken.data.access_token,
            AToken_Expires: newToken.data.expires_in,
            AToken_CreatedAt: currentTimeInSecond.toString(),
          },
        });
        console.log(newToken.data);
        return {
          access_token: newToken.data.access_token as string,
        };
      } else {
        //액세스 토큰과 리프레시 토큰 모두 만료
        return { result: "expired" };
      }
    } else return { result: "no_token" };
  } else return { result: "expired" }; //토큰이 없음
}

export { LoginKakao, ValidateKakao };
