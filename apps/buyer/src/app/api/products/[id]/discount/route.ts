import { NextResponse } from 'next/server';
import { demoProducts } from '@/lib/demo-data';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const product = demoProducts.find((item) => item.id === params.id);
  if (!product) {
    return NextResponse.json({ message: 'Product not found' }, { status: 404 });
  }

  const discount = product.discountMeta || { discountType: 'NONE', discountPercent: 0 };
  return NextResponse.json({ data: discount });
}
