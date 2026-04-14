import { NextRequest, NextResponse } from 'next/server';
import { extractDocument } from '@/lib/extraction/extract';
import { mergeExtractions, extractionToReportInput } from '@/lib/extraction/merge';
import type { DocumentType, ExtractionResult } from '@/lib/extraction/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const entries: { file: File; type: DocumentType }[] = [];
    let totalSize = 0;

    // Parse all file entries
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        const index = key.replace('file_', '');
        const docType = formData.get(`type_${index}`) as DocumentType;
        if (!docType) continue;

        if (value.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `File ${value.name} exceeds 10MB limit` },
            { status: 400 }
          );
        }
        totalSize += value.size;
        if (totalSize > MAX_TOTAL_SIZE) {
          return NextResponse.json(
            { error: 'Total upload size exceeds 50MB limit' },
            { status: 400 }
          );
        }

        entries.push({ file: value, type: docType });
      }
    }

    if (entries.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    // Extract data from each document
    const results: ExtractionResult[] = [];
    const errors: string[] = [];

    for (const entry of entries) {
      try {
        const buffer = await entry.file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mimeType = entry.file.type || 'application/pdf';

        const extraction = await extractDocument(base64, mimeType, entry.type, apiKey);
        results.push(extraction);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to process ${entry.file.name}: ${msg}`);
      }
    }

    // Merge all extractions
    const merged = mergeExtractions(results);
    const { input, extractedFields } = extractionToReportInput(merged);

    return NextResponse.json({
      success: true,
      extraction: merged,
      reportInput: input,
      extractedFields: Array.from(extractedFields),
      documentsProcessed: results.length,
      errors,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Extraction error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
