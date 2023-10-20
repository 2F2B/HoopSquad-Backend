import { PrismaClient } from "@prisma/client";
import { LatLngToAddress } from "../google-maps/googleMaps";

const prisma = new PrismaClient();

/**
 * 농구장 정보를 가져오는 함수
 * @param id
 * @returns
 */
async function getCourt(id?: number): Promise<
  | {
      Court_id: number;
      Name: string;
      Location: string;
      Map: {
        Lat: number;
        Lng: number;
      };
    }[]
  | {
      Court_id: number;
      Name: string;
      Location: string;
    }[]
> {
  if (id) {
    const court = await prisma.court.findMany({
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
    prisma.$disconnect();
    return court;
  } else {
    const court = await prisma.court.findMany({
      select: {
        Court_id: true,
        Name: true,
        Location: true,
      },
    });
    prisma.$disconnect();
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
  if (IsExist.length != 0) {
    return {
      Code: 400,
      TimeStamp: Date.now().toString(),
    };
  }
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

  return {
    Code: 200,
    TimeStamp: Date.now().toString(),
  };
}

export { getCourt, addCourt };
