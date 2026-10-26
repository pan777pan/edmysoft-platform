import { NextRequest, NextResponse } from 'next/server';
import { generateDailyReport, sendDailyReportToOwner } from '@/lib/daily-report';
import { isAdminRequest } from '@/lib/session';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  try {
    const report = await generateDailyReport();
    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  const result = await sendDailyReportToOwner();
  return NextResponse.json(result);
}
