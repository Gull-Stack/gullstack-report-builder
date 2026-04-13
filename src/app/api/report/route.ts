import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { input, result, userId, title } = await request.json();

    if (userId) {
      const report = await prisma.report.create({
        data: {
          userId,
          title: title || 'Federal Retirement Report',
          inputData: input as object,
          calculationResults: result as object,
        },
      });
      return NextResponse.json({ input, result, status: 'ready', reportId: report.id });
    }

    // Fallback: return data for client-side PDF generation without saving
    return NextResponse.json({ input, result, status: 'ready' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Report generation failed';
    console.error('Report error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
