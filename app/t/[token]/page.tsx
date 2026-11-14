import { notFound } from "next/navigation";
import { getPublicMenuByTableToken } from "@/lib/menu-service";
import { MenuClient } from "./menu-client";

export const dynamic = "force-dynamic";

/**
 * The QR destination: /t/<token>. Server-loads the full menu, then the
 * client component handles search/filter/cart/checkout interactions.
 */
export default async function TablePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const menu = await getPublicMenuByTableToken(token);
  if (!menu) notFound();

  return <MenuClient menu={menu} token={token} />;
}
