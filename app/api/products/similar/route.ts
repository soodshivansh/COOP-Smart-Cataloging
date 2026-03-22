import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('id');
    if (!productId) return NextResponse.json({ error: 'Product id required' }, { status: 400 });

    // Get the source product's tags and category
    const source = await prisma.product.findUnique({
      where: { id: productId },
      include: { tags: true },
    });
    if (!source) return NextResponse.json({ products: [] });

    const tagNames = source.tags.map(t => t.tag);

    // Find products sharing tags or same category, excluding self
    const similar = await prisma.product.findMany({
      where: {
        archived: false,
        id: { not: productId },
        OR: [
          { categoryId: source.categoryId },
          { tags: { some: { tag: { in: tagNames } } } },
        ],
      },
      include: { category: true, tags: true, attributes: true },
      take: 4,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products: similar });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
