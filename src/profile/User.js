"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function getUserProfile(userId) {
  return __awaiter(this, void 0, void 0, function* () {
    const Profile = yield prisma.user.findFirst({
      where: {
        User_id: userId,
      },
      select: {
        Name: true,
        Profile: true,
      },
    });
    if (isUserExist) {
      //유저가 있으면 삭제
      const user = yield prisma.user.delete({
        where: {
          User_id: isUserExist.User_id,
        },
      });
      return { result: "success" };
    } else throw new Error("User Not Exists");
  });
}
exports.getUserProfile = getUserProfile;
