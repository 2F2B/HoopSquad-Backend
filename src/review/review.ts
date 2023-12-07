import { PrismaClient, Review } from "@prisma/client";
import { NotFoundError } from "./error";
import { CreateReviewType, ReviewArray } from "../routes/reviewRouter";

const prisma = new PrismaClient();

async function getMatchPlayers(Posting_id: number) {
  const players = await prisma.member.findMany({
    where: {
      Posting_id: Posting_id,
    },
  });
  if (!players) throw new NotFoundError("players");
  const playersProfiles = await getPlayerNameAndImage(players);

  return playersProfiles;
}

async function setUserReview(players: object[]) {
  // {Player_id, isPositive, Comment}
  players.map((player) => {});
}

export { getMatchPlayers, setUserReview };

async function getPlayerNameAndImage(
  players: {
    id: number;
    Posting_id: number;
    User_id: number;
    IsHost: boolean;
  }[],
) {
  const profile = await Promise.all(
    players.map(async (player) => {
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
    }),
  );
  return profile;
}
