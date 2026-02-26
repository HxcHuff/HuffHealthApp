import { mkdir, readdir, readFile, rm, stat, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { DropboxFileMeta } from "@/types/dropbox";

export const DROPBOX_TTL_MS = 96 * 60 * 60 * 1000;
const BASE_DIR = process.env.DROPBOX_STORAGE_DIR || path.join(process.cwd(), ".tmp", "dropbox");

function metaPathFor(id: string) {
  return path.join(BASE_DIR, `${id}.json`);
}

function filePathFor(storedName: string) {
  return path.join(BASE_DIR, storedName);
}

function isExpired(meta: DropboxFileMeta) {
  return new Date(meta.expiresAt).getTime() <= Date.now();
}

export async function ensureDropboxDir() {
  await mkdir(BASE_DIR, { recursive: true });
}

export async function purgeExpiredDropboxFiles() {
  await ensureDropboxDir();
  const entries = await readdir(BASE_DIR);
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    const fullMetaPath = path.join(BASE_DIR, entry);
    try {
      const raw = await readFile(fullMetaPath, "utf8");
      const meta = JSON.parse(raw) as DropboxFileMeta;
      if (!isExpired(meta)) continue;
      await rm(filePathFor(meta.storedName), { force: true });
      await rm(fullMetaPath, { force: true });
    } catch {
      await rm(fullMetaPath, { force: true });
    }
  }
}

export async function listDropboxFiles() {
  await purgeExpiredDropboxFiles();
  const entries = await readdir(BASE_DIR);
  const files: DropboxFileMeta[] = [];
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    const raw = await readFile(path.join(BASE_DIR, entry), "utf8");
    const meta = JSON.parse(raw) as DropboxFileMeta;
    files.push(meta);
  }
  return files.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function saveDropboxFile(input: {
  fileBuffer: Buffer;
  originalName: string;
  mimeType: string;
  uploadedById: string;
  uploadedByName: string;
}) {
  await purgeExpiredDropboxFiles();
  const id = randomUUID();
  const ext = path.extname(input.originalName) || "";
  const storedName = `${id}${ext}`;
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + DROPBOX_TTL_MS);

  const meta: DropboxFileMeta = {
    id,
    originalName: input.originalName,
    storedName,
    mimeType: input.mimeType || "application/octet-stream",
    sizeBytes: input.fileBuffer.byteLength,
    uploadedById: input.uploadedById,
    uploadedByName: input.uploadedByName,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  await writeFile(filePathFor(storedName), input.fileBuffer);
  await writeFile(metaPathFor(id), JSON.stringify(meta, null, 2), "utf8");
  return meta;
}

export async function getDropboxFileById(id: string) {
  await purgeExpiredDropboxFiles();
  const raw = await readFile(metaPathFor(id), "utf8");
  const meta = JSON.parse(raw) as DropboxFileMeta;
  const fullFilePath = filePathFor(meta.storedName);
  const info = await stat(fullFilePath);
  if (!info.isFile()) throw new Error("Invalid file");
  return { meta, fullFilePath };
}

export async function deleteDropboxFileById(id: string) {
  const raw = await readFile(metaPathFor(id), "utf8");
  const meta = JSON.parse(raw) as DropboxFileMeta;
  await rm(filePathFor(meta.storedName), { force: true });
  await rm(metaPathFor(id), { force: true });
}
