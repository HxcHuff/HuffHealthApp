"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, RefreshCw, Trash2, Upload } from "lucide-react";
import type { DropboxFileMeta } from "@/types/dropbox";

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function hoursUntilExpiry(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (60 * 60 * 1000)));
}

export function DocumentsWorkspace({ initialFiles }: { initialFiles: DropboxFileMeta[] }) {
  const [files, setFiles] = useState(initialFiles);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const totalBytes = useMemo(
    () => files.reduce((sum, file) => sum + file.sizeBytes, 0),
    [files]
  );

  async function refreshFiles() {
    const res = await fetch("/api/dropbox/files", { cache: "no-store" });
    const data = (await res.json()) as { files?: DropboxFileMeta[]; error?: string };
    if (!res.ok || !data.files) {
      setMessage(data.error || "Failed to refresh files");
      return;
    }
    setFiles(data.files);
    setMessage("Drop Box refreshed");
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", selectedFile);

    const res = await fetch("/api/dropbox/files", {
      method: "POST",
      body: formData,
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(data.error || "Upload failed");
      setUploading(false);
      return;
    }
    setSelectedFile(null);
    await refreshFiles();
    setUploading(false);
    setMessage("File uploaded");
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setMessage("");
    const res = await fetch(`/api/dropbox/files/${id}`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(data.error || "Delete failed");
      setBusyId(null);
      return;
    }
    setFiles((prev) => prev.filter((file) => file.id !== id));
    setBusyId(null);
    setMessage("File deleted");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents Drop Box</h1>
        <p className="mt-1 text-sm text-gray-500">
          Temporary secure storage for CRM documents. Files auto-delete after 96 hours.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-900">Security Policy</p>
        <p className="mt-1 text-xs text-amber-800">
          Every uploaded file is automatically purged 96 hours after upload. Use this for short-lived operational transfers only.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto]">
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload"}
          </button>
          <button
            type="button"
            onClick={refreshFiles}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">Max size: 25MB per file</p>
        {message && <p className="mt-2 text-xs font-medium text-gray-700">{message}</p>}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">Active Temp Files</p>
          <p className="text-xs text-gray-500">
            {files.length} files · {formatBytes(totalBytes)}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Uploaded By</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Expires In</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{file.originalName}</p>
                    <p className="text-xs text-gray-500">
                      Uploaded {new Date(file.createdAt).toLocaleString()}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{file.uploadedByName}</td>
                  <td className="px-4 py-3 text-gray-700">{formatBytes(file.sizeBytes)}</td>
                  <td className="px-4 py-3 text-gray-700">{hoursUntilExpiry(file.expiresAt)}h</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/api/dropbox/files/${file.id}/download`}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(file.id)}
                        disabled={busyId === file.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {files.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-gray-500">No active files in Drop Box.</p>
          )}
        </div>
      </div>
    </div>
  );
}
