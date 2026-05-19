import { NextResponse } from 'next/server';
import { demoManufacturers } from '@/lib/demo-data';

export async function GET() {
  return NextResponse.json({ data: demoManufacturers });
}
