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

async function setUserReview(Reviews: CreateReviewType[], AccessToken: string) {
  // {Player_id, isPositive, Comment}
  const user = await prisma.oAuthToken.findFirstOrThrow({
    where: {
      AccessToken: AccessToken,
    },
  });

  Reviews.map(async (review) => {
    const temp = await prisma.review.create({
      data: {
        IsPositive: review.isPositive,
        Comment: review.Comment,
        ReviewRelay: {
          create: {
            User_id: user.User_id,
            IsWriter: true,
          },
        },
      },
    });
    await prisma.reviewRelay.create({
      data: {
        Review: { connect: { Review_id: temp.Review_id } },
        User: { connect: { User_id: review.Player_id } },
      },
    });

    let score = 0;
    score += review.isPositive ? 5 : -3;
    score += review.isJoin ? 3 : -10;

    await prisma.profile.update({
      where: {
        User_id: review.Player_id,
      },
      data: {
        Overall: {
          increment: score,
        },
      },
    });
  });
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
