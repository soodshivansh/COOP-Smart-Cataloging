import { NextRequest, NextResponse } from 'next/server';
import { AIEngineService } from '@/services/ai-engine';
import { requireAuth } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req, 'admin');
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { description } = await req.json();
    if (!description) return NextResponse.json({ error: 'Description required' }, { status: 400 });

    const improved = await AIEngineService.improveDescription(description);
    return NextResponse.json({ improved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
