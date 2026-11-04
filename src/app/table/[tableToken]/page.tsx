"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

export default function TableLandingPage() {
  const params = useParams();
  const router = useRouter();
  const { setTableSession } = useCart();

  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const rawToken = params.tableToken as string;
    if (!rawToken) {
      setIsValid(false);
      return;
    }

    // Token format: tbl_{number}_{hash}
    const parts = rawToken.split("_");
    if (parts.length >= 3 && parts[0] === "tbl") {
      const extractedNumber = parts[1].toUpperCase();
      setTableNumber(extractedNumber);
      setIsValid(true);
      setTableSession(extractedNumber, rawToken);

      // Auto redirect to menu after 1.2s for pleasant onboarding animation
      const timer = setTimeout(() => {
        router.push(`/menu?table=${extractedNumber}&token=${rawToken}`);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setIsValid(false);
    }
  }, [params, router, setTableSession]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-6 text-white text-center">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-neutral-900/80 p-8 backdrop-blur-xl shadow-2xl">
        {isValid === true ? (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 animate-bounce">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">
              Welcome to Table {tableNumber}
            </h1>
            <p className="mt-2 text-xs text-neutral-300">
              The Urban Plate • Verified Dine-in Session
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-amber-400">
              <Sparkles className="h-4 w-4 animate-spin" />
              <span>Opening Chef&apos;s Digital Menu...</span>
            </div>
          </div>
        ) : isValid === false ? (
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="font-display text-xl font-bold text-white">
              Invalid Table QR
            </h2>
            <p className="mt-2 text-xs text-neutral-300">
              This QR code token could not be verified. Please ask your server for assistance or browse Table 04 in demo mode.
            </p>
            <button
              onClick={() => router.push("/menu?table=04")}
              className="mt-6 flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-all"
            >
              <span>Explore Demo Menu</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Sparkles className="h-8 w-8 text-amber-400 animate-spin mb-4" />
            <p className="text-sm font-semibold">Verifying Table QR Token...</p>
          </div>
        )}
      </div>
    </div>
  );
}
