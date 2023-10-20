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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LatLngToAddress = exports.AddressToLatLng = void 0;
const axios_1 = __importDefault(require("axios"));
const apiKey_1 = require("../apiKey");
/**
 * 주소를 위경도로 바꿔주는 함수
 * @param {string} address 주소
 * @returns 위도와 경도
 */
function AddressToLatLng(address) {
    return __awaiter(this, void 0, void 0, function* () {
        const fetchedData = yield axios_1.default.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey_1.gMap}&language=ko`);
        return fetchedData.data.results[0].geometry.location;
    });
}
exports.AddressToLatLng = AddressToLatLng;
/**
 * 위경도를 주소로 바꿔주는 함수
 * @param {number} lat 위도
 * @param {number} lng 경도
 * @returns 주소
 */
function LatLngToAddress(lat, lng) {
    return __awaiter(this, void 0, void 0, function* () {
        const fetchedData = yield axios_1.default.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey_1.gMap}&language=ko`);
        const formattedAddress = fetchedData.data.results.map((result) => result.formatted_address);
        return { result: formattedAddress };
    });
}
exports.LatLngToAddress = LatLngToAddress;
