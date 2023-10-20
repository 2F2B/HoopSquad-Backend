"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignupResponse = exports.LoginResponse = void 0;
const GAuthKeys_1 = require("../GAuthKeys");
function LoginResponse() {
    let url = "https://accounts.google.com/o/oauth2/v2/auth";
    url += `?client_id=${GAuthKeys_1.gClientId}`;
    url += `&redirect_uri=${GAuthKeys_1.gLoginRedirectUri}`;
    url += `&response_type=code`;
    url += `&scope=email profile`;
    url += `&access_type=offline`;
    return url;
}
exports.LoginResponse = LoginResponse;
function SignupResponse() {
    let url = "https://accounts.google.com/o/oauth2/v2/auth";
    url += `?client_id=${GAuthKeys_1.gClientId}`;
    url += `&redirect_uri=${GAuthKeys_1.gSignup_Redirect_uri}`;
    url += `&response_type=code`;
    url += `&scope=email profile`;
    url += `&access_type=offline`;
    return url;
}
exports.SignupResponse = SignupResponse;
