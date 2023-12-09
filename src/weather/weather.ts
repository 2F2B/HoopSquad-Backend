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

  let temperature: number;

  result.data.response.body.items.item.forEach((item: any) => {
    const data = item.fcstValue;
    switch (item.category) {
      case "TMP":
        console.log(`기온: ${data}`);
        break;
      case "WSD":
        console.log(`풍속: ${data}`);
        break;
      case "SKY":
        console.log(`하늘 상태: ${data}`);
        break;
      case "PTY":
        console.log(`강수 형태: ${data}`);
        break;
      case "POP":
        console.log(`강수 확률: ${data}`);
        break;
    }
  });
  return result.data;
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
