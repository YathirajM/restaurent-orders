"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TablePage() {
  const params = useParams();
  const router = useRouter();
  const tableToken = params.tableToken as string;

  useEffect(() => {
    if (tableToken) {
      // Redirect to menu with table parameter
      router.replace(`/menu?table=${tableToken}`);
    }
  }, [tableToken, router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p>Loading...</p>
      </div>
    </div>
  );
}