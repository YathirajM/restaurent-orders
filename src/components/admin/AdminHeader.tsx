"use client";

import React, { useState, useEffect } from "react";
import { realtime } from "@/lib/realtime";
import { playNewOrderSound } from "@/lib/sound";
import {
  Menu,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

export function AdminHeader({ onToggleSidebar }: AdminHeaderProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);

  // Initialize theme
  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  };

  const handleSimulateOrder = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "simulate-order" }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        realtime.emit("ORDER_CREATED", data.data);
        if (soundEnabled) playNewOrderSound();
        setDemoMessage(`Simulated live order #${data.data.orderNumber} for Table 03!`);
        setTimeout(() => setDemoMessage(null), 4000);
      }
    } catch (err) {
      console.error("Simulation error", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm("Reset database back to initial pristine demo state?")) return;
    setIsResetting(true);
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json();
      if (data.success) {
        realtime.emit("MENU_UPDATED", {});
        setDemoMessage("Demo data reset to fresh state!");
        setTimeout(() => {
          setDemoMessage(null);
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      console.error("Reset error", err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/80 bg-background/80 px-4 sm:px-6 backdrop-blur-md">
      {/* Left Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Live Restaurant State Pill */}
        <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Kitchen Active</span>
        </div>

        {demoMessage && (
          <span className="hidden sm:inline-block text-xs font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full animate-fade-in">
            {demoMessage}
          </span>
        )}
      </div>

      {/* Right Action Tools for Demos */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Simulate New Order Button */}
        <button
          onClick={handleSimulateOrder}
          disabled={isSimulating}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50 transition-all active:scale-95"
          title="Simulate a new incoming customer order for presentations"
        >
          {isSimulating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-white" />
          )}
          <span className="hidden sm:inline">Simulate Order</span>
        </button>

        {/* Reset Demo Data Button */}
        <button
          onClick={handleResetDemo}
          disabled={isResetting}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Reset sample orders & inventory back to demo state"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? "animate-spin" : ""}`} />
          <span className="hidden md:inline">Reset Demo</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
          title={soundEnabled ? "Mute order chimes" : "Enable order chimes"}
        >
          {soundEnabled ? (
            <Volume2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <VolumeX className="h-4 w-4 text-red-500" />
          )}
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
          title="Toggle Dark / Light Theme"
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
