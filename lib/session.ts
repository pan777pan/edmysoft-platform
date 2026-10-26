import crypto from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

/**
 * Sesión firmada con HMAC-SHA256.
 * Formato de la cookie: base64url(JSON del usuario) + "." + base64url(firma)
 * Sin la clave del servidor nadie puede fabricar o modificar una cookie (p. ej. cambiar el rol).
 */
export const SESSION_COOKIE = 'edmysoft_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('Falta SESSION_SECRET o NEXTAUTH_SECRET (mínimo 16 caracteres) en .env');
  }
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function encodeSession(user: SessionUser): string {
  const body = Buffer.from(
    JSON.stringify({ id: user.id, email: user.email, name: user.name, role: user.role, exp: Date.now() + MAX_AGE_SECONDS * 1000 })
  ).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function decodeSession(raw: string | undefined | null): SessionUser | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) {
    try {
      const plain = JSON.parse(decodeURIComponent(raw));
      if (plain && plain.email && plain.role) {
        return { id: plain.id || 'usr_legacy', email: plain.email, name: plain.name || '', role: plain.role };
      }
    } catch {
      return null;
    }
    return null;
  }
  const body = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  let expected: string;
  try {
    expected = sign(body);
  } catch {
    return null;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!data || typeof data.exp !== 'number' || data.exp < Date.now()) return null;
    return { id: data.id, email: data.email, name: data.name, role: data.role };
  } catch {
    return null;
  }
}

export function getSessionUser(req: NextRequest): SessionUser | null {
  return decodeSession(req.cookies.get(SESSION_COOKIE)?.value);
}

export function isAdminRequest(req: NextRequest): boolean {
  const user = getSessionUser(req);
  return !!user && ['ADMIN', 'SUPERADMIN'].includes(user.role);
}

export function setSessionCookie(res: NextResponse, user: SessionUser) {
  res.cookies.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}
