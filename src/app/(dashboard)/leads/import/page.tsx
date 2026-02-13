"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  parseCSVContent,
  parseExcelBuffer,
  autoDetectMapping,
  LEAD_FIELD_OPTIONS,
  type ParsedFile,
  type FieldMapping,
  type ImportResult,
} from "@/lib/csv-parser";
import { PageHeader } from "@/components/shared/page-header";
import { Upload, FileSpreadsheet, Check, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";

type Step = "upload" | "mapping" | "preview" | "importing" | "results";

export default function ImportLeadsPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [fileName, setFileName] = useState("");
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [listName, setListName] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);
    setListName(file.name.replace(/\.[^.]+$/, ""));

    try {
      let parsed: ParsedFile;
      if (file.name.endsWith(".csv") || file.name.endsWith(".txt")) {
        const text = await file.text();
        parsed = parseCSVContent(text);
      } else {
        const buffer = await file.arrayBuffer();
        parsed = parseExcelBuffer(buffer);
      }

      if (parsed.headers.length === 0) {
        setError("No columns found in the file. Check the format.");
        return;
      }

      setParsedFile(parsed);
      setMappings(autoDetectMapping(parsed.headers));
      setStep("mapping");
    } catch {
      setError("Failed to parse the file. Make sure it's a valid CSV or Excel file.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
  });

  function updateMapping(index: number, leadField: string) {
    setMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, leadField: leadField as FieldMapping["leadField"] } : m))
    );
  }

  async function handleImport() {
    if (!parsedFile) return;

    setStep("importing");
    try {
      const response = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: parsedFile.rows,
          mappings,
          listName,
          fileName,
          source: fileName.toLowerCase().includes("facebook") ? "Facebook" : "CSV Import",
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Import failed");

      setImportResult(result);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStep("preview");
    }
  }

  const mappedFieldCount = mappings.filter((m) => m.leadField !== "skip").length;

  return (
    <>
      <PageHeader title="Import Leads" description="Upload a CSV or Excel file to bulk import leads" />

      <div className="flex items-center gap-2 mb-6">
        {["upload", "mapping", "preview", "results"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                step === s || (step === "importing" && s === "preview")
                  ? "bg-blue-600 text-white"
                  : ["upload", "mapping", "preview", "results"].indexOf(step === "importing" ? "preview" : step) > i
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {["upload", "mapping", "preview", "results"].indexOf(step === "importing" ? "preview" : step) > i ? (
                <Check className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            <span className="text-xs font-medium text-gray-600 hidden sm:inline capitalize">{s}</span>
            {i < 3 && <div className="w-8 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 flex items-center gap-2 text-sm text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {step === "upload" && (
        <div
          {...getRootProps()}
          className={`rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400 bg-white"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-10 w-10 text-gray-400 mb-4" />
          <p className="text-sm font-medium text-gray-700">
            {isDragActive ? "Drop your file here" : "Drag & drop a file, or click to browse"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supports CSV, XLS, XLSX files. Works great with Facebook Lead Ad exports.
          </p>
        </div>
      )}

      {step === "mapping" && parsedFile && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">List Name</label>
              <input
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <FileSpreadsheet className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {fileName} &middot; {parsedFile.totalRows} rows &middot; {parsedFile.headers.length} columns
              </span>
            </div>

            <h3 className="text-sm font-semibold text-gray-900 mb-3">Map Columns to Lead Fields</h3>
            <div className="space-y-2">
              {mappings.map((mapping, index) => (
                <div key={mapping.csvColumn} className="flex items-center gap-3">
                  <span className="w-48 text-sm text-gray-700 truncate">{mapping.csvColumn}</span>
                  <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <select
                    value={mapping.leadField}
                    onChange={(e) => updateMapping(index, e.target.value)}
                    className={`flex-1 max-w-xs rounded-lg border px-3 py-1.5 text-sm ${
                      mapping.leadField !== "skip"
                        ? "border-green-300 bg-green-50"
                        : "border-gray-300"
                    }`}
                  >
                    {LEAD_FIELD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("upload")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 inline mr-1" />
              Back
            </button>
            <button
              onClick={() => setStep("preview")}
              disabled={mappedFieldCount === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Preview ({mappedFieldCount} fields mapped)
              <ArrowRight className="h-4 w-4 inline ml-1" />
            </button>
          </div>
        </div>
      )}

      {step === "preview" && parsedFile && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700">
                Preview (first 10 of {parsedFile.totalRows} rows)
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {mappings
                      .filter((m) => m.leadField !== "skip")
                      .map((m) => (
                        <th key={m.csvColumn} className="text-left px-3 py-2 text-xs font-medium text-gray-500">
                          {LEAD_FIELD_OPTIONS.find((o) => o.value === m.leadField)?.label}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedFile.rows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      {mappings
                        .filter((m) => m.leadField !== "skip")
                        .map((m) => (
                          <td key={m.csvColumn} className="px-3 py-2 text-gray-700">
                            {row[m.csvColumn] || "—"}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("mapping")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 inline mr-1" />
              Back
            </button>
            <button
              onClick={handleImport}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Import {parsedFile.totalRows} Leads
            </button>
          </div>
        </div>
      )}

      {step === "importing" && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-700">Importing leads...</p>
          <p className="text-xs text-gray-500 mt-1">This may take a moment for large files.</p>
        </div>
      )}

      {step === "results" && importResult && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Import Complete</h3>
            <div className="mt-4 grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-2xl font-bold text-gray-900">{importResult.totalProcessed}</p>
                <p className="text-xs text-gray-500">Total Processed</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3">
                <p className="text-2xl font-bold text-green-600">{importResult.successCount}</p>
                <p className="text-xs text-gray-500">Imported</p>
              </div>
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-2xl font-bold text-red-600">{importResult.failedCount}</p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="mt-4 text-left max-w-md mx-auto">
                <p className="text-sm font-medium text-gray-700 mb-2">Errors:</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {importResult.errors.slice(0, 20).map((err, i) => (
                    <p key={i} className="text-xs text-red-600">
                      Row {err.row}: {err.error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/leads")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              View Leads
            </button>
            <button
              onClick={() => {
                setStep("upload");
                setParsedFile(null);
                setImportResult(null);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}
    </>
  );
}
