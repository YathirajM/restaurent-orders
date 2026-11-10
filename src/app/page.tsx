"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, Loader2, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Auto-redirect to menu or show QR scanner
  useEffect(() => {
    // Check if this is a table-specific access (from QR code)
    const checkAccess = async () => {
      try {
        // In a real app, we'd scan the QR code or use the table token
        // For demo, we'll show the landing page
        setLoading(false);
      } catch (err) {
        setError('Failed to load');
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  const tables = Array.from({ length: 12 }, (_, i) => i + 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-transparent" />

        <div className="relative px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Restaurant
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Scan a QR code at your table to order
          </p>

          {/* Scan QR CTA */}
          <div className="max-w-sm mx-auto bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700">
            <QrCode className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">Scan the QR code on your table</p>
            <p className="text-sm text-gray-400">
              Point your camera at the QR code to start ordering
            </p>
          </div>
        </div>
      </div>

      {/* Quick Table Access (Demo) */}
      <div className="px-6 pb-16">
        <h2 className="text-white font-semibold mb-4 text-center">Demo: Select Table</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-w-md mx-auto">
          {tables.map(table => (
            <button
              key={table}
              onClick={() => router.push(`/menu?table=T${table}`)}
              className="aspect-square rounded-xl bg-gray-800 border border-gray-700 hover:border-amber-500 hover:bg-amber-500/10 transition-all group flex items-center justify-center"
            >
              <span className="text-white font-semibold group-hover:text-amber-500">
                {table}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Admin Link */}
      <div className="fixed bottom-4 right-4">
        <a
          href="/admin"
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm hover:text-white hover:bg-gray-700 transition-colors"
        >
          Admin
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}