import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

// Optimized font loading with swap for faster rendering
const fontVariables = {
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontDisplay: 'swap',
  fontVariable: '--font-sans',
};

export const metadata: Metadata = {
  title: {
    default: "The Urban Plate • Premium QR Restaurant Ordering & Management",
    template: "%s | The Urban Plate",
  },
  description:
    "A next-generation dine-in QR ordering system, SaaS admin dashboard, and kitchen display system (KDS) engineered for modern restaurants.",
  keywords: ["restaurant", "QR ordering", "food", "menu", "dining", "KDS"],
  authors: [{ name: "The Urban Plate" }],
  creator: "The Urban Plate",
  publisher: "The Urban Plate",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "The Urban Plate",
  },
};

export const viewport: Viewport = {
  themeColor: "#c28e34",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen selection:bg-amber-500/20 selection:text-amber-600">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
