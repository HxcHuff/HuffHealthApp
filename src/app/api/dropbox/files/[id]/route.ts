import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteDropboxFileById } from "@/lib/dropbox";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: Params) {
  const session = await auth();
  if (!session || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    await deleteDropboxFileById(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
