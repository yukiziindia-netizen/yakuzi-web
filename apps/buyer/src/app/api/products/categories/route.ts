import { NextResponse } from 'next/server';
import { demoCategories } from '@/lib/demo-data';

export async function GET() {
  return NextResponse.json({ data: demoCategories });
}
