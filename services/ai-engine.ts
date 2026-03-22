import Groq from 'groq-sdk';
import { CacheService } from '@/lib/redis';
import type {
  AnalysisResult,
  CategorySuggestion,
  TagSuggestion,
  AttributeSuggestion,
} from '@/types';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export class AIEngineService {
  private static requestCount = 0;
  private static requestWindow = Date.now();
  private static readonly MAX_REQUESTS_PER_MINUTE = 100;

  static async analyzeProduct(image: Buffer | string, description: string): Promise<AnalysisResult> {
    const startTime = Date.now();

    const cacheKey = CacheService.generateCacheKey(
      typeof image === 'string' ? image : image.toString('base64') + description
    );

    const cached = await this.getCachedAnalysis(cacheKey);
    if (cached) return { ...cached, cached: true, processingTime: Date.now() - startTime };

    await this.checkRateLimit();

    const [imageAnalysis, textAnalysis] = await Promise.all([
      this.analyzeImage(image),
      this.extractAttributes(description),
    ]);

    const result: AnalysisResult = {
      categories: imageAnalysis.categories,
      tags: [...imageAnalysis.tags, ...textAnalysis.tags],
      attributes: [...imageAnalysis.attributes, ...textAnalysis.attributes],
      title: imageAnalysis.title,
      processingTime: Date.now() - startTime,
      cached: false,
    };

    await this.cacheAnalysis(cacheKey, result);
    return result;
  }

  static async analyzeImage(image: Buffer | string): Promise<{
    categories: CategorySuggestion[];
    tags: TagSuggestion[];
    attributes: AttributeSuggestion[];
    title: string;
  }> {
    try {
      const imageBase64 = typeof image === 'string'
        ? image.replace(/^data:image\/\w+;base64,/, '')
        : image.toString('base64');

      const response = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this product image and provide:
1. A short product title (3-6 words, e.g. "Blue Wireless Noise-Cancelling Headphones")
2. Primary category (e.g., Electronics, Clothing, Furniture)
3. Up to 5 relevant tags
4. Only include attributes you can clearly determine from the image. Skip any attribute you are not sure about — do not use "Unknown".

Return ONLY valid JSON, no markdown: { "title": "...", "category": "...", "tags": ["..."], "attributes": { "color": "...", "material": "..." } }`,
              },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      const text = response.choices[0]?.message?.content || '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return {
        title: parsed.title || '',
        categories: [{ name: parsed.category || 'Uncategorized', confidence: 0.85, isPrimary: true }],
        tags: (parsed.tags || []).map((tag: string) => ({ name: tag, confidence: 0.8 })),
        attributes: Object.entries(parsed.attributes || {})
          .filter(([, value]) => value && value !== 'Unknown' && value !== 'unknown' && value !== 'N/A')
          .map(([name, value]) => ({
            name, value: value as string, confidence: 0.8, source: 'image' as const,
          })),
      };
    } catch (error) {
      console.error('Image analysis error:', error);
      throw new Error('Failed to analyze image');
    }
  }

  static async extractAttributes(description: string): Promise<{
    tags: TagSuggestion[];
    attributes: AttributeSuggestion[];
  }> {
    if (!description || description.trim().length === 0) return { tags: [], attributes: [] };

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'user',
            content: `Extract product information from this description: "${description}"

Provide:
1. Relevant tags (keywords)
2. Only include attributes (brand, material, dimensions, color, type) that you can confidently infer from the description. Do not include attributes with value "Unknown".

Return ONLY valid JSON, no markdown: { "tags": ["..."], "attributes": { "brand": "...", "color": "..." } }`,
          },
        ],
        max_tokens: 400,
      });

      const text = response.choices[0]?.message?.content || '{}';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return {
        tags: (parsed.tags || []).map((tag: string) => ({ name: tag, confidence: 0.75 })),
        attributes: Object.entries(parsed.attributes || {})
          .filter(([, value]) => value && value !== 'Unknown' && value !== 'unknown' && value !== 'N/A')
          .map(([name, value]) => ({
            name, value: value as string, confidence: 0.75, source: 'text' as const,
          })),
      };
    } catch (error) {
      console.error('Text extraction error:', error);
      return { tags: [], attributes: [] };
    }
  }

  static async getCachedAnalysis(cacheKey: string): Promise<AnalysisResult | null> {
    return CacheService.get<AnalysisResult>(cacheKey);
  }

  static async cacheAnalysis(cacheKey: string, result: AnalysisResult): Promise<void> {
    await CacheService.set(cacheKey, result, CacheService.AI_ANALYSIS_TTL);
  }

  private static async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowDuration = 60 * 1000;
    if (now - this.requestWindow > windowDuration) {
      this.requestCount = 0;
      this.requestWindow = now;
    }
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      const waitTime = windowDuration - (now - this.requestWindow);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.requestWindow = Date.now();
    }
    this.requestCount++;
  }

  static async withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: Error;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        if (error.status === 400 || error.status === 401) throw error;
        if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    throw lastError!;
  }

  static async improveDescription(description: string): Promise<string> {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'user',
          content: `Rewrite this product description to be more professional, clear, and appealing for an e-commerce catalogue. Keep it concise (2-3 sentences max). Do not add made-up specs.

Original: "${description}"

Return ONLY the improved description text, no quotes, no explanation.`,
        },
      ],
      max_tokens: 200,
    });
    return response.choices[0]?.message?.content?.trim() || description;
  }

  static async parseNaturalLanguageQuery(query: string): Promise<{
    keywords: string;
    categories: string[];
    attributes: Record<string, string>;
  }> {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'user',
          content: `Parse this product search query into structured filters.

Query: "${query}"

Extract:
- keywords: the core search terms (remove filter words)
- categories: any product categories mentioned (e.g. Electronics, Clothing)
- attributes: key-value pairs like color, material, brand, size

Return ONLY valid JSON, no markdown: { "keywords": "...", "categories": ["..."], "attributes": { "color": "...", "brand": "..." } }`,
        },
      ],
      max_tokens: 200,
    });

    const text = response.choices[0]?.message?.content || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      keywords: parsed.keywords || query,
      categories: parsed.categories || [],
      attributes: parsed.attributes || {},
    };
  }
}
