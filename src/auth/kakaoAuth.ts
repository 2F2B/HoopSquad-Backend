import axios from "axios";
import { kakaoAPIKey } from "../apiKey";

async function LoginKakao(code: any) {
  const result = await axios.post(
    "https://kauth.kakao.com/oauth/token",
    {
      grant_type: "authorization_code",
      client_id: kakaoAPIKey,
      redirect_uri:
        "http://ec2-52-79-227-4.ap-northeast-2.compute.amazonaws.com/auth/register/kakao",
      code: code,
    },
    {
      headers: {
        "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    },
  );

  return result.data;
}

export { LoginKakao };
