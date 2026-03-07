import { NextRequest, NextResponse } from 'next/server';
import { AIEngineService } from '@/services/ai-engine';
import { requireAuth } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const { image, description } = body;

    if (!image || !description) {
      return NextResponse.json(
        { error: 'Image and description are required' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer if needed
    const imageBuffer = image.startsWith('data:')
      ? Buffer.from(image.split(',')[1], 'base64')
      : image;

    const result = await AIEngineService.analyzeProduct(imageBuffer, description);

    return NextResponse.json({
      suggestions: {
        categories: result.categories,
        tags: result.tags,
        attributes: result.attributes,
      },
      processingTime: result.processingTime,
      cached: result.cached || false,
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze product' },
      { status: 500 }
    );
  }
}
