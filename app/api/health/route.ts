import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const [total, missingTags, missingAttributes, archived] = await Promise.all([
      prisma.product.count({ where: { archived: false } }),
      prisma.product.count({ where: { archived: false, tags: { none: {} } } }),
      prisma.product.count({ where: { archived: false, attributes: { none: {} } } }),
      prisma.product.count({ where: { archived: true } }),
    ]);

    const issues = missingTags + missingAttributes;
    const maxIssues = total * 2;
    const score = total === 0 ? 100 : Math.round(((maxIssues - issues) / maxIssues) * 100);

    return NextResponse.json({ score, total, missingTags, missingAttributes, archived });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
