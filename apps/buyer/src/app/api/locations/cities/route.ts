import { NextResponse } from 'next/server';
import { demoCities } from '@/lib/demo-data';

export async function GET() {
  return NextResponse.json({ data: demoCities });
}
