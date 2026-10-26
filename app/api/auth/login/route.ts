import { NextRequest, NextResponse } from 'next/server';
import { verifyUserCredentials } from '@/lib/auth';
import { setSessionCookie } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Correo y contraseña requeridos' },
        { status: 400 }
      );
    }

    const sessionUser = await verifyUserCredentials(email, password);

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas. Verifica tu usuario y contraseña.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      redirectTo: ['ADMIN', 'SUPERADMIN'].includes(sessionUser.role) ? '/admin' : '/portal',
    });

    // Guardar sesión en cookie firmada criptográficamente con HMAC-SHA256
    setSessionCookie(response, sessionUser);

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Error interno en el servidor de autenticación' },
      { status: 500 }
    );
  }
}
