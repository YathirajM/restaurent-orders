import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const categories = store.getCategories().map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      image: c.image,
      displayOrder: c.displayOrder,
    }));

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}