import { GoogleGenerativeAI } from '@google/generative-ai';
import { CacheService } from '@/lib/redis';
import type {
  AnalysisResult,
  CategorySuggestion,
  TagSuggestion,
  AttributeSuggestion,
} from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class AIEngineService {
  private static requestCount = 0;
  private static requestWindow = Date.now();
  private static readonly MAX_REQUESTS_PER_MINUTE = 100;

  /**
   * Analyze product image and description
   */
  static async analyzeProduct(
    image: Buffer | string,
    description: string
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    // Generate cache key
    const cacheKey = CacheService.generateCacheKey(
      typeof image === 'string' ? image : image.toString('base64') + description
    );

    // Check cache first
    const cached = await this.getCachedAnalysis(cacheKey);
    if (cached) {
      return {
        ...cached,
        cached: true,
        processingTime: Date.now() - startTime,
      };
    }

    // Rate limiting check
    await this.checkRateLimit();

    // Perform analysis
    const [imageAnalysis, textAnalysis] = await Promise.all([
      this.analyzeImage(image),
      this.extractAttributes(description),
    ]);

    // Combine results
    const result: AnalysisResult = {
      categories: imageAnalysis.categories,
      tags: [...imageAnalysis.tags, ...textAnalysis.tags],
      attributes: [...imageAnalysis.attributes, ...textAnalysis.attributes],
      processingTime: Date.now() - startTime,
      cached: false,
    };

    // Cache the result
    await this.cacheAnalysis(cacheKey, result);

    return result;
  }

  /**
   * Analyze image using Google Gemini Vision API
   */
  static async analyzeImage(image: Buffer | string): Promise<{
    categories: CategorySuggestion[];
    tags: TagSuggestion[];
    attributes: AttributeSuggestion[];
  }> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const imageBase64 = typeof image === 'string' ? image : image.toString('base64');

      const prompt = `Analyze this product image and provide:
1. Primary category (e.g., Electronics, Clothing, Furniture)
2. Up to 5 relevant tags
3. Visual attributes (color, material, shape)

Return as JSON: { "category": "...", "tags": ["..."], "attributes": { "color": "...", "material": "...", "shape": "..." } }`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg',
          },
        },
      ]);

      const response = result.response;
      const text = response.text();
      
      // Extract JSON from response (Gemini sometimes wraps it in markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return {
        categories: [
          {
            name: parsed.category || 'Uncategorized',
            confidence: 0.85,
            isPrimary: true,
          },
        ],
        tags: (parsed.tags || []).map((tag: string) => ({
          name: tag,
          confidence: 0.8,
        })),
        attributes: Object.entries(parsed.attributes || {}).map(([name, value]) => ({
          name,
          value: value as string,
          confidence: 0.8,
          source: 'image' as const,
        })),
      };
    } catch (error) {
      console.error('Image analysis error:', error);
      throw new Error('Failed to analyze image');
    }
  }

  /**
   * Extract attributes from product description using NLP
   */
  static async extractAttributes(description: string): Promise<{
    tags: TagSuggestion[];
    attributes: AttributeSuggestion[];
  }> {
    if (!description || description.trim().length === 0) {
      return { tags: [], attributes: [] };
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      const prompt = `Extract product information from this description: "${description}"

Provide:
1. Relevant tags (keywords)
2. Attributes like brand, material, dimensions, color

Return as JSON: { "tags": ["..."], "attributes": { "brand": "...", "material": "...", "color": "..." } }`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return {
        tags: (parsed.tags || []).map((tag: string) => ({
          name: tag,
          confidence: 0.75,
        })),
        attributes: Object.entries(parsed.attributes || {}).map(([name, value]) => ({
          name,
          value: value as string,
          confidence: 0.75,
          source: 'text' as const,
        })),
      };
    } catch (error) {
      console.error('Text extraction error:', error);
      return { tags: [], attributes: [] };
    }
  }

  /**
   * Get cached analysis result
   */
  static async getCachedAnalysis(cacheKey: string): Promise<AnalysisResult | null> {
    return CacheService.get<AnalysisResult>(cacheKey);
  }

  /**
   * Cache analysis result
   */
  static async cacheAnalysis(cacheKey: string, result: AnalysisResult): Promise<void> {
    await CacheService.set(cacheKey, result, CacheService.AI_ANALYSIS_TTL);
  }

  /**
   * Check and enforce rate limiting
   */
  private static async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowDuration = 60 * 1000; // 1 minute

    // Reset counter if window has passed
    if (now - this.requestWindow > windowDuration) {
      this.requestCount = 0;
      this.requestWindow = now;
    }

    // Check if limit exceeded
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      const waitTime = windowDuration - (now - this.requestWindow);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.requestWindow = Date.now();
    }

    this.requestCount++;
  }

  /**
   * Retry with exponential backoff
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Don't retry on user errors
        if (error.status === 400 || error.status === 401) {
          throw error;
        }

        // Wait with exponential backoff
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }
}
