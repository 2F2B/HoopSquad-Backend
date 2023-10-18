
import express from 'express';
import axios from 'axios';
import { gClientId, gSignup_Redirect_uri, gLoginRedirectUri, gToken_uri } from '../GAuthKeys';

function AuthResponse() {
  let url = 'https://accounts.google.com/o/oauth2/v2/auth';

  url += `?client_id=${gClientId}`
  url += `&redirect_uri=${gLoginRedirectUri}`
  url += `&response_type=code`
  url += `&scope=email profile`

  return url
}

function SignupResponse() {
  let url = 'https://accounts.google.com/o/oauth2/v2/auth';

  url += `?client_id=${gClientId}`
  url += `&redirect_uri=${gSignup_Redirect_uri}`
  url += `&response_type=code`
  url += `&scope=email profile`

  return url
}

export {AuthResponse, SignupResponse};
