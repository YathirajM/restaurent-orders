import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "The Urban Plate • Premium QR Restaurant Ordering & Management",
  description:
    "A next-generation dine-in QR ordering system, SaaS admin dashboard, and kitchen display system (KDS) engineered for modern restaurants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
