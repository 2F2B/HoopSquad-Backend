import axios from "axios";

async function getWeather(X: number, Y: number) {
  const floor_X = Math.floor(X);
  const floor_Y = Math.floor(Y);

  const currentDate = new Date();
  const { year, month, day } = getYearMonthDay(currentDate); // 두 자리로 맞추기
  const currentHour = currentDate.getHours();
  const baseTime = getBaseTime(currentHour);
  const formattedDate = `${year}${month}${day}`;

  const endPoint = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${process.env.weatherKey}&numOfRows=10&pageNo=1&dataType=JSON&base_date=${formattedDate}&base_time=${baseTime}&nx=${floor_X}&ny=${floor_Y}`;

  const result = await axios.get(endPoint);
  if (result.data.response.header.resultMsg !== "NORMAL_SERVICE")
    throw new Error(result.data.response.header.resultMsg);

  let temperature: number | undefined;
  let windSpeed: number | undefined;
  let sky: string | undefined;
  let precipitation: string | undefined;
  let precipitationPercentage: number | undefined;

  result.data.response.body.items.item.map((item: any) => {
    const data = item.fcstValue;
    switch (item.category) {
      case "TMP": //기온
        temperature = data;
        break;
      case "WSD": //풍속
        windSpeed = data;
        break;
      case "SKY": //하늘 상태
        if (data == 1) {
          sky = "sunny";
        } else if (data == 3) {
          sky = "cloudy";
        } else sky = "very cloudy";
        break;
      case "PTY": //강수 형태
        switch (data) {
          case "0":
            precipitation = "none";
            break;
          case "1":
            precipitation = "rain";
            break;
          case "2":
            precipitation = "rain/snow";
            break;
          case "3":
            precipitation = "snow";
            break;
          case "4":
            precipitation = "shower";
            break;
        }
        break;
      case "POP": //강수 확률
        precipitationPercentage = data;
        break;
    }
  });

  return {
    temperature,
    windSpeed,
    sunny: sky,
    precipitation,
    precipitationPercentage,
  };
}

export { getWeather };
function getYearMonthDay(currentDate: Date) {
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0"); // 월은 0부터 시작하므로 +1 해주고, 두 자리로 맞추기
  const day = currentDate.getDate().toString().padStart(2, "0"); // 두 자리로 맞추기
  return { year, month, day };
}

function getBaseTime(currentHour: number) {
  const baseTimeRanges = [2, 5, 8, 11, 14, 17, 20, 23];
  const baseTime =
    (
      baseTimeRanges.find(
        (time) => currentHour >= time && currentHour < time + 3,
      ) || 23
    )
      .toString()
      .padStart(2, "0") + "00";
  return baseTime;
}
