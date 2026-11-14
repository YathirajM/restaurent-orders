import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { handle } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const parsed = loginSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid email and password" },
        { status: 400 },
      );
    }

    const rows = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, parsed.data.email.toLowerCase()))
      .limit(1);
    const user = rows[0];

    // Constant-ish response time: always run a compare even when user missing.
    const hash =
      user?.passwordHash ??
      "$2a$12$C6UzMDM.H6dfI/f/IKcEeO1SOrHh.WQOrJxKHzWcPfTfCPzCqQqLu"; // hash of random
    const ok = await verifyPassword(parsed.data.password, hash);
    if (!user || !ok || !user.isActive) {
      return NextResponse.json(
        { error: "Incorrect email or password" },
        { status: 401 },
      );
    }

    const token = await createSession(user.id);
    await setSessionCookie(token);

    return NextResponse.json({
      user: { name: user.name, email: user.email, role: user.role },
    });
  });
}
