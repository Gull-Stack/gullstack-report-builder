import { NextRequest, NextResponse } from 'next/server';
import type { ReportInput } from '@/lib/types';
import { calculateReport } from '@/lib/calculations';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { saveToDb, userId, title, ...inputFields } = body as ReportInput & {
      saveToDb?: boolean;
      userId?: string;
      title?: string;
    };
    const input: ReportInput = inputFields;

    if (!input.personal?.dateOfBirth || !input.employment?.plannedRetirementDate) {
      return NextResponse.json(
        { error: 'Missing required fields: dateOfBirth and plannedRetirementDate' },
        { status: 400 }
      );
    }

    const result = calculateReport(input);

    // Optionally persist to database
    if (saveToDb && userId) {
      const report = await prisma.report.create({
        data: {
          userId,
          title: title || `${input.personal.fullName} — Retirement Analysis`,
          inputData: input as object,
          calculationResults: result as object,
        },
      });
      return NextResponse.json({ ...result, reportId: report.id });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Calculation failed';
    console.error('Calculation error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
