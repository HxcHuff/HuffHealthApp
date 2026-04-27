import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listDropboxFiles, saveDropboxFile } from "@/lib/dropbox";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export async function GET() {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const files = await listDropboxFiles();
  return NextResponse.json({ files });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds 25MB limit" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const meta = await saveDropboxFile({
    fileBuffer: buffer,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    uploadedById: session.user.id,
    uploadedByName: session.user.name || session.user.email || "Unknown",
  });

  return NextResponse.json({ success: true, file: meta }, { status: 201 });
}
