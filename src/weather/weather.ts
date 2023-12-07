import axios from "axios";

async function getWeather() {
  let endPoint = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${process.env.weatherKey}&numOfRows=10&pageNo=1&dataType=JSON&base_date=20231203&base_time=0500&nx=86&ny=95`;
  const result = await axios.get(endPoint);
  console.log(result.data);
}

export { getWeather };
