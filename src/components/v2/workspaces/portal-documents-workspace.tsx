"use client";

import { useState } from "react";

type Doc = { name: string; status: string };

export function PortalDocumentsWorkspace({ initialDocs }: { initialDocs: Doc[] }) {
  const [docs, setDocs] = useState(initialDocs);
  const [newDoc, setNewDoc] = useState("");

  function upload() {
    if (!newDoc.trim()) return;
    setDocs((prev) => [{ name: newDoc.trim(), status: "Uploaded" }, ...prev]);
    setNewDoc("");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
        <p className="mt-1 text-sm text-gray-500">Upload documents and track request status.</p>
      </div>
      <div className="flex gap-2">
        <input value={newDoc} onChange={(e) => setNewDoc(e.target.value)} placeholder="Document name" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button onClick={upload} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Upload</button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
        {docs.map((doc) => (
          <div key={`${doc.name}-${doc.status}`} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
            <p className="text-sm text-gray-800">{doc.name}</p>
            <p className="text-xs text-gray-600">{doc.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
