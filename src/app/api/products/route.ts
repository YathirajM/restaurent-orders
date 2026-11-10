import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  try {
    const products = store.getProducts().map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.image,
      categoryId: p.categoryId,
      isVeg: p.isVeg,
      isAvailable: p.isAvailable,
      isBestseller: p.isBestseller,
      spiceLevel: p.spiceLevel,
      preparationTimeMinutes: p.preparationTimeMinutes,
    }));

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}