"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyMatch = exports.getAlarm = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * 특정 사용자의 모든 알림을 반환하는 함수
 * @param {number} id
 * @returns
 */
function getAlarm(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const alarmList = yield prisma.alarm.findMany({
            where: {
                User_id: id,
            },
            select: {
                Alarm_id: true,
                UserImage: true,
                Text: true,
                IsRead: true,
                IsApply: true,
            },
        });
        return alarmList;
    });
}
exports.getAlarm = getAlarm;
function applyMatch(body) {
    return __awaiter(this, void 0, void 0, function* () {
        yield prisma.alarm.update({
            where: {
                Alarm_id: body.Alarm_id,
            },
            data: {
                IsApply: body.IsApply,
            },
        });
    });
}
exports.applyMatch = applyMatch;
