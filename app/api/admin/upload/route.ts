import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { images } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { handle } from "@/lib/api";
import { newId } from "@/lib/ids";

export const dynamic = "force-dynamic";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** POST /api/admin/upload — multipart image upload, stored in DB. */
export async function POST(req: Request) {
  return handle(async () => {
    await requireUser(["owner", "manager"]);

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP or GIF images are allowed" },
        { status: 415 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be 4 MB or smaller" },
        { status: 413 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const id = newId();
    await db.insert(images).values({
      id,
      mimeType: file.type,
      data: buf.toString("base64"),
      sizeBytes: buf.length,
    });

    return NextResponse.json({ id, url: `/api/images/${id}` }, { status: 201 });
  });
}