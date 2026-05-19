import { NextResponse } from 'next/server';
import { featuredDemoProducts } from '@/lib/demo-data';

export async function GET() {
  return NextResponse.json({ data: featuredDemoProducts });
}
