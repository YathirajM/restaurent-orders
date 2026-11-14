import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { diningTables } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { handle } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/qr?tableId=… — renders a printable QR code (SVG) for a table.
 * The QR encodes APP_URL + /t/<qrToken> so scanning opens the menu directly.
 */
export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser(["owner", "manager"]);
    const tableId = new URL(req.url).searchParams.get("tableId");
    if (!tableId) {
      return NextResponse.json({ error: "tableId is required" }, { status: 400 });
    }

    const rows = await db
      .select()
      .from(diningTables)
      .where(eq(diningTables.id, tableId))
      .limit(1);
    const table = rows[0];
    if (!table || table.restaurantId !== user.restaurantId) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const url = `${appUrl.replace(/\/$/, "")}/t/${table.qrToken}`;

    const svg = await QRCode.toString(url, {
      type: "svg",
      margin: 1,
      width: 512,
      color: { dark: "#1e1a16", light: "#ffffff" },
      errorCorrectionLevel: "M",
    });

    return new NextResponse(svg, {
      headers: { "Content-Type": "image/svg+xml" },
    });
  });
}