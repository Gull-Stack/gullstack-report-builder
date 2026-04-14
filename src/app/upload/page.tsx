'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Shield, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { DOCUMENT_TYPE_LABELS, type DocumentType } from '@/lib/extraction/types';


interface UploadSlot {
  type: DocumentType;
  file: File | null;
  status: 'empty' | 'selected' | 'processing' | 'done' | 'error';
  error?: string;
}

const SLOTS: DocumentType[] = ['SF50', 'LES', 'TSP_STATEMENT', 'SOCIAL_SECURITY', 'DD214'];

export default function UploadPage() {
  const router = useRouter();
  const [slots, setSlots] = useState<UploadSlot[]>(
    SLOTS.map((type) => ({ type, file: null, status: 'empty' }))
  );
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ extractedFields: string[]; errors: string[] } | null>(null);

  const updateSlot = useCallback((index: number, update: Partial<UploadSlot>) => {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...update } : s)));
  }, []);

  const handleFileSelect = useCallback(
    (index: number, file: File | null) => {
      if (!file) return;
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        updateSlot(index, { file: null, status: 'error', error: 'File exceeds 10MB limit' });
        return;
      }
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        updateSlot(index, { file: null, status: 'error', error: 'Invalid file type. Use PDF, JPG, or PNG.' });
        return;
      }
      updateSlot(index, { file, status: 'selected', error: undefined });
    },
    [updateSlot]
  );

  const handleDrop = useCallback(
    (index: number, e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      handleFileSelect(index, file);
    },
    [handleFileSelect]
  );

  const removeFile = useCallback(
    (index: number) => {
      updateSlot(index, { file: null, status: 'empty', error: undefined });
    },
    [updateSlot]
  );

  const filesSelected = slots.filter((s) => s.file !== null);

  const handleProcess = async () => {
    if (filesSelected.length === 0) return;

    setProcessing(true);
    setProgress(10);
    setResult(null);

    // Mark all selected slots as processing
    setSlots((prev) =>
      prev.map((s) => (s.file ? { ...s, status: 'processing' as const } : s))
    );

    try {
      const formData = new FormData();
      let idx = 0;
      for (const slot of slots) {
        if (slot.file) {
          formData.append(`file_${idx}`, slot.file);
          formData.append(`type_${idx}`, slot.type);
          idx++;
        }
      }

      setProgress(30);

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      setProgress(80);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Extraction failed');
      }

      const data = await response.json();
      setProgress(100);

      // Mark slots as done
      setSlots((prev) =>
        prev.map((s) => (s.file ? { ...s, status: 'done' as const } : s))
      );

      setResult({
        extractedFields: data.extractedFields || [],
        errors: data.errors || [],
      });

      // Store the extracted input for the calculator review step
      if (data.reportInput && typeof window !== 'undefined') {
        localStorage.setItem('extracted-report-input', JSON.stringify(data.reportInput));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSlots((prev) =>
        prev.map((s) => (s.status === 'processing' ? { ...s, status: 'error' as const, error: msg } : s))
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Upload Your Documents
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Upload your federal employment documents and our AI will extract all the data needed
            to generate your comprehensive retirement benefits report.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-500">
            <Shield className="h-4 w-4" />
            <span>Files are processed in memory only — never stored on our servers</span>
          </div>
        </div>

        {/* Upload Slots */}
        <div className="space-y-4 mb-8">
          {slots.map((slot, index) => (
            <Card
              key={slot.type}
              className={`border-2 transition-colors ${
                slot.status === 'done'
                  ? 'border-green-500/50 bg-green-950/20'
                  : slot.status === 'error'
                  ? 'border-red-500/50 bg-red-950/20'
                  : slot.status === 'selected'
                  ? 'border-blue-500/50 bg-blue-950/20'
                  : 'border-slate-700/50 bg-slate-900/50'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="shrink-0">
                    {slot.status === 'done' ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : slot.status === 'error' ? (
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    ) : slot.status === 'processing' ? (
                      <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                    ) : (
                      <FileText className="h-8 w-8 text-slate-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-sm">
                        {DOCUMENT_TYPE_LABELS[slot.type]}
                      </h3>
                      {slot.type === 'DD214' && (
                        <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                          Optional
                        </Badge>
                      )}
                    </div>
                    {slot.file ? (
                      <p className="text-sm text-slate-400 truncate">{slot.file.name} ({(slot.file.size / 1024).toFixed(0)} KB)</p>
                    ) : (
                      <p className="text-sm text-slate-500">PDF, JPG, or PNG — max 10MB</p>
                    )}
                    {slot.error && (
                      <p className="text-sm text-red-400 mt-1">{slot.error}</p>
                    )}
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    {slot.file && slot.status !== 'processing' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : slot.status !== 'processing' ? (
                      <div
                        className="relative"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(index, e)}
                      >
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => handleFileSelect(index, e.target.files?.[0] || null)}
                        />
                        <Button variant="outline" size="sm" className="pointer-events-none">
                          <Upload className="h-4 w-4 mr-1" />
                          Choose File
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress */}
        {processing && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              <span className="text-sm text-slate-300">AI is reading your documents...</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Results */}
        {result && (
          <Card className="border-green-500/30 bg-green-950/20 mb-6">
            <CardHeader>
              <CardTitle className="text-green-400 text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Extraction Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 mb-2">
                {result.extractedFields.length} fields extracted from your documents.
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-sm text-amber-400">⚠ {err}</p>
                  ))}
                </div>
              )}
              <Button
                className="mt-4 bg-green-600 hover:bg-green-700"
                onClick={() => router.push('/calculator')}
              >
                Review & Generate Report →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Process Button */}
        {!result && (
          <div className="text-center">
            <Button
              size="lg"
              disabled={filesSelected.length === 0 || processing}
              onClick={handleProcess}
              className="bg-[#C9A84C] hover:bg-[#D4B65E] text-slate-900 font-semibold px-8"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Process {filesSelected.length} Document{filesSelected.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
            <p className="text-slate-500 text-sm mt-3">
              Upload at least your SF-50 and LES for the best results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
