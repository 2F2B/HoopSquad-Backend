"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignupResponse = exports.AuthResponse = void 0;
const GAuthKeys_1 = require("../GAuthKeys");
function AuthResponse() {
    let url = 'https://accounts.google.com/o/oauth2/v2/auth';
    url += `?client_id=${GAuthKeys_1.gClientId}`;
    url += `&redirect_uri=${GAuthKeys_1.gLoginRedirectUri}`;
    url += `&response_type=code`;
    url += `&scope=email profile`;
    return url;
}
exports.AuthResponse = AuthResponse;
function SignupResponse() {
    let url = 'https://accounts.google.com/o/oauth2/v2/auth';
    url += `?client_id=${GAuthKeys_1.gClientId}`;
    url += `&redirect_uri=${GAuthKeys_1.gSignup_Redirect_uri}`;
    url += `&response_type=code`;
    url += `&scope=email profile`;
    return url;
}
exports.SignupResponse = SignupResponse;
