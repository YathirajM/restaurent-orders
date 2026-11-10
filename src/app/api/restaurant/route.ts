import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const settings = store.getRestaurant();
    const tables = store.getTables();
    const categories = store.getCategories();

    return NextResponse.json({
      success: true,
      data: { settings, tables, categories },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}