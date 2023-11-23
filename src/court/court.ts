import { PrismaClient } from "@prisma/client";
import { LatLngToAddress } from "../google-maps/googleMaps";
import { CourtAlreadyExistError, NoCourtExistError } from "./error";

const prisma = new PrismaClient();

/**
 * 농구장 정보를 가져오는 함수
 * @param id
 * @returns
 */
async function getCourt(id?: number) {
  if (id) {
    const court = await prisma.court.findFirst({
      where: {
        Court_id: id,
      },
      select: {
        Court_id: true,
        Name: true,
        Location: true,
        Map: {
          select: {
            Lat: true,
            Lng: true,
          },
        },
      },
    });
    if (!court) throw new NoCourtExistError();
    return court;
  } else {
    const court = await prisma.court.findMany({
      select: {
        Court_id: true,
        Name: true,
        Location: true,
      },
    });
    return court;
  }
}

function getCurrentDate() {
  const currentDate = new Date(Date.now());

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  const hours = String(currentDate.getHours()).padStart(2, "0");
  const minutes = String(currentDate.getMinutes()).padStart(2, "0");
  const seconds = String(currentDate.getSeconds()).padStart(2, "0");

  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return formattedDate;
}

async function addCourt(req: { Name: string; Lat: number; Lng: number }) {
  const Location = await LatLngToAddress(req.Lat, req.Lng);
  const IsExist = await prisma.court.findMany({
    where: {
      OR: [
        { Name: req.Name },
        { Map: { AND: [{ Lat: req.Lat }, { Lng: req.Lng }] } },
      ],
    },
  });
  if (IsExist.length != 0) throw new CourtAlreadyExistError();
  await prisma.court.create({
    data: {
      Name: req.Name,
      Date: Date.now().toString(),
      Location: Location.result[0],
      Map: {
        create: {
          LocationName: req.Name,
          Lat: req.Lat,
          Lng: req.Lng,
        },
      },
    },
  });

  return { TimeStamp: getCurrentDate() };
}

export { getCourt, addCourt };
