import { PrismaClient } from "@prisma/client";
import { NotFoundError } from "./error";

const prisma = new PrismaClient();

async function getPlayers(Posting_id: number) {
  const players = await prisma.member.findMany({
    where: {
      Posting_id: Posting_id,
    },
  });
  if (!players) throw new NotFoundError("players");
  const playersProfiles = getPlayerNameAndImage(players);

  return playersProfiles;
}

export { getPlayers };

function getPlayerNameAndImage(
  players: {
    id: number;
    Posting_id: number;
    User_id: number;
    IsHost: boolean;
  }[],
) {
  return players.map(async (player) => {
    const profile = await prisma.user.findFirstOrThrow({
      where: {
        User_id: player.User_id,
      },
      select: {
        Name: true,
        Profile: {
          select: {
            Image: {
              select: {
                ImageData: true,
              },
            },
          },
        },
      },
    });

    return { ...profile?.Profile[0].Image[0], Name: profile?.Name };
  });
}
