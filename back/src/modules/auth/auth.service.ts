import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { verifyGoogleCredential } from '../../utils/google.js';
import { upsertUser, type User } from '../users/users.repository.js';

export function signToken(user: User) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function resolveRole(email: string): User['role'] {
  const adminEmails = env.ADMIN_EMAILS.split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.toLowerCase()) ? 'admin' : 'student';
}

export async function loginWithGoogle(credential: string) {
  const googleUser = await verifyGoogleCredential(credential);
  const user = await upsertUser({
    googleId: googleUser.sub,
    name: googleUser.name ?? googleUser.email,
    email: googleUser.email,
    role: resolveRole(googleUser.email),
    picture: googleUser.picture
  });

  return { token: signToken(user), user };
}
