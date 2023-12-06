import { PrismaClient } from "@prisma/client";
import { LatLngToAddress } from "../google-maps/googleMaps";
import { CourtAlreadyExistError, NoCourtExistError } from "./error";
import { getISOTime } from "../match/match";

const prisma = new PrismaClient();

/**
 * 농구장 정보를 가져오는 함수
 * @param id
 * @returns
 */
async function getCourt(id?: number) {
  if (id) {
    const court = await prisma.court.findFirstOrThrow({
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
      Date: getISOTime(),
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

  return { TimeStamp: getISOTime() };
}

async function reportCourt(id: number) {
  await prisma.court.findFirstOrThrow({
    where: {
      Court_id: id,
    },
  });

  await prisma.report.create({
    data: {
      Court_id: id,
    },
  });
}

export { getCourt, addCourt, reportCourt };
