import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';
import { findUserById, type User } from '../modules/users/users.repository.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new HttpError(401, 'Token de autenticacion requerido');
    }

    const token = header.replace('Bearer ', '');
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId)) throw new HttpError(401, 'Token invalido');

    const user = await findUserById(userId);
    if (!user) throw new HttpError(401, 'Usuario no encontrado');

    req.user = user;
    next();
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(401, 'Token invalido o expirado'));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    next(new HttpError(403, 'Se requiere rol administrador'));
    return;
  }

  next();
}
