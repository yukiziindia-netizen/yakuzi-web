import { NextResponse } from 'next/server';
import { demoProducts } from '@/lib/demo-data';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const product = demoProducts.find((item) => item.id === id);

  if (!product) {
    return NextResponse.json({ message: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({ data: product });
}
