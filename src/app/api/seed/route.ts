import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Database reset and seeded successfully',
      data: {
        products: store.getProducts().length,
        categories: store.getCategories().length,
        tables: store.getTables().length,
        orders: store.getOrders().length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}