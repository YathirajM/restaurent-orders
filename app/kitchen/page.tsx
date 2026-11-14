import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { KitchenBoard } from "./kitchen-board";

export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/kitchen");
  return <KitchenBoard userName={user.name} />;
}
