import { NextResponse } from "next/server";

/** Standard JSON error response. */
export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Wraps a handler, converting thrown errors (incl. auth status) into JSON. */
export async function handle(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    const e = err as Error & { status?: number };
    const status = e.status ?? 500;
    if (status === 500) {
      console.error("[api] unexpected error:", e);
    }
    return jsonError(
      status === 500 ? "Something went wrong. Please try again." : e.message,
      status,
    );
  }
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
