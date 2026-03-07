import { NextRequest, NextResponse } from 'next/server';
import { SearchEngineService } from '@/services/search-engine';
import { requireAuth } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const categories = searchParams.get('categories')?.split(',').filter(Boolean);
    
    const result = await SearchEngineService.search(
      query,
      { categories },
      { page, limit }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}
