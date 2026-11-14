import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { images } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * GET /api/images/:id — serves an uploaded image from the DB.
 * Immutable: aggressive browser caching by id.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return new NextResponse("Bad id", { status: 400 });
  }
  const rows = await db.select().from(images).where(eq(images.id, id)).limit(1);
  const img = rows[0];
  if (!img) return new NextResponse("Not found", { status: 404 });

  const buf = Buffer.from(img.data, "base64");
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": img.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}