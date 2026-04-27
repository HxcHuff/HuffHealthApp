import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDropboxFileById } from "@/lib/dropbox";

interface Params {
  params: Promise<{ id: string }>;
}

function encodeFileName(fileName: string) {
  return encodeURIComponent(fileName).replace(/['()]/g, escape).replace(/\*/g, "%2A");
}

export async function GET(_request: Request, context: Params) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const { meta, fullFilePath } = await getDropboxFileById(id);
    const data = await readFile(fullFilePath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": meta.mimeType || "application/octet-stream",
        "Content-Length": String(data.byteLength),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeFileName(meta.originalName)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found or expired" }, { status: 404 });
  }
}
