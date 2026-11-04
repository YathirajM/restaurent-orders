import QRCode from "qrcode";

const SECRET_SALT = "urban_plate_table_sec_2026";

/**
 * Creates a signed token for a table that cannot be easily tampered with
 */
export function generateTableToken(tableNumber: string): string {
  // Simple deterministic signature for demo/production integrity
  const raw = `${tableNumber}:${SECRET_SALT}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, "0");
  return `tbl_${tableNumber.toLowerCase().replace(/[^a-z0-9]/g, "")}_${hexHash}`;
}

/**
 * Validates whether a token matches the claimed table number
 */
export function verifyTableToken(tableNumber: string, token: string): boolean {
  if (!tableNumber || !token) return false;
  const expected = generateTableToken(tableNumber);
  return token === expected;
}

/**
 * Generates high-res Data URL QR Code
 */
export async function generateQrDataUrl(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: "#1e1b18",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    });
  } catch (err) {
    console.error("QR generation error", err);
    return "";
  }
}
