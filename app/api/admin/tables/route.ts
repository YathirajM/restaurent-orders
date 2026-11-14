import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { diningTables } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth";
import { handle } from "@/lib/api";
import { newId, newTableToken } from "@/lib/ids";

export const dynamic = "force-dynamic";

/** GET /api/admin/tables */
export async function GET() {
  return handle(async () => {
    const user = await requireUser(["owner", "manager"]);
    const rows = await db
      .select()
      .from(diningTables)
      .where(eq(diningTables.restaurantId, user.restaurantId))
      .orderBy(asc(diningTables.label));
    return NextResponse.json({ tables: rows });
  });
}

/** POST /api/admin/tables — create a table (or regenerate its QR token). */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser(["owner", "manager"]);
    const body = (await req.json().catch(() => null)) as {
      label?: string;
      regenerate?: boolean;
      tableId?: string;
    } | null;
    if (!body?.label?.trim()) {
      return NextResponse.json({ error: "Table label is required" }, { status: 400 });
    }

    if (body.regenerate && body.tableId) {
      const token = newTableToken();
      await db
        .update(diningTables)
        .set({ qrToken: token })
        .where(eq(diningTables.id, body.tableId));
      return NextResponse.json({ token });
    }

    const id = newId();
    const token = newTableToken();
    await db.insert(diningTables).values({
      id,
      restaurantId: user.restaurantId,
      label: body.label.trim(),
      qrToken: token,
    });
    return NextResponse.json({ id, token }, { status: 201 });
  });
}

/** DELETE /api/admin/tables/:id */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<Record<string, string>> },
) {
  const id = (await params).id;
  return handle(async () => {
    await requireUser(["owner", "manager"]);
    await db.delete(diningTables).where(eq(diningTables.id, id));
    return NextResponse.json({ ok: true });
  });
}