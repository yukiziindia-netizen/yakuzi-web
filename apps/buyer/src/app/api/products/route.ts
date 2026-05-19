import { NextRequest, NextResponse } from 'next/server';
import { demoProducts, filterDemoProducts } from '@/lib/demo-data';

export async function GET(request: NextRequest) {
  const pageParam = request.nextUrl.searchParams.get('page');
  const limitParam = request.nextUrl.searchParams.get('limit');
  const page = pageParam ? Math.max(1, Number(pageParam)) : 1;
  const limit = limitParam ? Math.max(1, Number(limitParam)) : 24;

  const filtered = filterDemoProducts(request);
  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const pagedProducts = filtered.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    data: {
      products: pagedProducts,
      meta: {
        total,
        page,
        limit,
      },
    },
  });
}
