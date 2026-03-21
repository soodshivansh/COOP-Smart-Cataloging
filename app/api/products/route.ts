import { NextRequest, NextResponse } from 'next/server';
import { ProductDataManager } from '@/services/product-data-manager';
import { requireAuth } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const categoryId = searchParams.get('categoryId') || undefined;

    const result = await ProductDataManager.listProducts({
      limit,
      offset,
      categoryId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req, 'admin');
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const { imageUrl, description, categoryId, tags, attributes } = body;

    if (!imageUrl || !description || !categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const product = await ProductDataManager.createProduct(
      {
        imageUrl,
        description,
        categoryId,
        tags: tags || [],
        attributes: attributes || [],
      },
      authResult.user.id
    );

    return NextResponse.json({ product, version: product.version }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
