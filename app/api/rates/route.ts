import { NextResponse } from 'next/server';
import { fetchRates } from '@/lib/bam';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchRates();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=60',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Rate fetch failed' }, { status: 500 });
  }
}
