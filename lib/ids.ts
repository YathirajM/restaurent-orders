import { randomBytes, randomUUID } from "crypto";

export function newId(): string {
  return randomUUID();
}

/** Short, human-friendly order number: e.g. "7K2M-14" — unique per run of the RNG. */
export function newOrderNumber(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I/L/O/0/1
  const chars = randomBytes(4);
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += alphabet[chars[i] % alphabet.length];
  }
  const seq = (Date.now() % 90) + 10; // 10–99, rotates constantly
  return `${code}-${seq}`;
}

/** Opaque URL-safe token for table QR codes. */
export function newTableToken(): string {
  return randomBytes(18).toString("base64url");
}
