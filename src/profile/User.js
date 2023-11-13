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
    return Object.assign(
      Object.assign(
        {},
        Profile === null || Profile === void 0 ? void 0 : Profile.Profile,
      ),
      { Name: Profile === null || Profile === void 0 ? void 0 : Profile.Name },
    );
  });
}
exports.getUserProfile = getUserProfile;
