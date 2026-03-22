import { NextRequest, NextResponse } from 'next/server';
import { AIEngineService } from '@/services/ai-engine';
import { requireAuth } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

    const parsed = await AIEngineService.parseNaturalLanguageQuery(query);
    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
