import { HttpError } from './httpError.js';
import { env } from '../config/env.js';

type GoogleTokenPayload = {
  iss: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

export async function verifyGoogleCredential(credential: string): Promise<GoogleTokenPayload> {
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new HttpError(401, 'No fue posible validar la credencial de Google');
  }

  const payload = (await response.json()) as GoogleTokenPayload;
  if (payload.aud !== env.GOOGLE_CLIENT_ID || !payload.email_verified) {
    throw new HttpError(401, 'Credencial de Google invalida');
  }

  return payload;
}
