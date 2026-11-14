import { NextResponse } from "next/server";
import { getPublicMenuByTableToken } from "@/lib/menu-service";
import { handle } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  return handle(async () => {
    const menu = await getPublicMenuByTableToken(token);
    if (!menu) {
      return NextResponse.json(
        { error: "Invalid table code. Please scan the QR code on your table." },
        { status: 404 },
      );
    }
    return NextResponse.json(menu);
  });
}
