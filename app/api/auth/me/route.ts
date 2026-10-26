import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const user = getSessionUser(req);
    if (!user) {
      return NextResponse.json({ success: false, authenticated: false, user: null });
    }

    return NextResponse.json({ success: true, authenticated: true, user });
  } catch {
    return NextResponse.json({ success: false, authenticated: false, user: null });
  }
}
