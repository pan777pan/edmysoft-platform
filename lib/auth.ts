import bcrypt from 'bcryptjs';
import prisma from './prisma';

export interface AuthUserSession {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Contraseña maestra oficial solicitada para admin
export const OFFICIAL_ADMIN_EMAIL = 'ediergallego59@gmail.com';
export const OFFICIAL_ADMIN_PASSWORD = 'edsoft1013341239';

/**
 * Valida las credenciales del usuario.
 * Acepta de forma directa y garantizada las credenciales oficiales de admin
 * y comprueba contra la base de datos con hash bcrypt.
 */
export async function verifyUserCredentials(emailRaw: string, passwordRaw: string): Promise<AuthUserSession | null> {
  const email = String(emailRaw || '').trim().toLowerCase();
  const password = String(passwordRaw || '');

  if (!email || !password) return null;

  // Verificación directa para el administrador Edier Mery Gallego
  if (email === OFFICIAL_ADMIN_EMAIL.toLowerCase() && password === OFFICIAL_ADMIN_PASSWORD) {
    const adminUser = await prisma.user.findUnique({
      where: { email: OFFICIAL_ADMIN_EMAIL.toLowerCase() },
    });

    if (adminUser) {
      return {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role, // SUPERADMIN
      };
    }

    // Si aún no está en BD (fallback seguro)
    return {
      id: 'usr_admin_edier',
      email: OFFICIAL_ADMIN_EMAIL,
      name: 'Edier Mery Gallego',
      role: 'SUPERADMIN',
    };
  }

  // Verificación contra la base de datos para otros usuarios o clientes
  const dbUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!dbUser) return null;

  // Si la contraseña coincide con el hash o si es cliente presembrado
  let isValid = false;
  try {
    isValid = await bcrypt.compare(password, dbUser.passwordHash);
  } catch {
    isValid = false;
  }

  // Contraseñas de auditoría pre-sembradas
  if (!isValid) {
    if (email === 'cliente@grupologistico.co' && password === 'Cliente#2026!') isValid = true;
    if (email === 'sistemas@clinicasanmartin.co' && password === 'Clinica#2026!') isValid = true;
  }

  if (isValid) {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
    };
  }

  return null;
}
