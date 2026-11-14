import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { handle } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST() {
  return handle(async () => {
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  });
}
