import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const saveToken = async (userId: string, token: string) => {
  let statusCode: number;
  const isTokenExist = await prisma.pushToken.findFirst({
    where: {
      User_id: +userId,
    },
  });
  if (!isTokenExist) {
    await prisma.pushToken.create({
      data: {
        User: { connect: { User_id: +userId } },
        Token: token,
      },
    });
    statusCode = 201;
  } else statusCode = 302;

  return statusCode;
};

const getToken = async (userId: string) => {
  return (
    await prisma.pushToken.findFirstOrThrow({
      where: {
        User_id: +userId,
      },
    })
  ).Token;
};

const removeToken = async (userId: string) => {
  await prisma.pushToken.delete({
    where: {
      User_id: +userId,
    },
  });
};

export { saveToken, getToken, removeToken };
