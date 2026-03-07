import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/redis';
import type { SearchResult, FilterOptions, SearchFacets } from '@/types';

export class SearchEngineService {
  /**
   * Search products with filters
   */
  static async search(
    query: string,
    filters: FilterOptions = {},
    pagination: { page?: number; limit?: number } = {}
  ): Promise<SearchResult> {
    const startTime = Date.now();
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const offset = (page - 1) * limit;

    // Generate cache key
    const cacheKey = `search:${JSON.stringify({ query, filters, page, limit })}`;
    
    // Check cache
    const cached = await CacheService.get<SearchResult>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build where clause
    const where: any = {
      archived: false,
    };

    // Add text search
    if (query) {
      where.OR = [
        { description: { contains: query, mode: 'insensitive' } },
        { category: { name: { contains: query, mode: 'insensitive' } } },
        { tags: { some: { tag: { contains: query, mode: 'insensitive' } } } },
      ];
    }

    // Add category filter
    if (filters.categories && filters.categories.length > 0) {
      where.categoryId = { in: filters.categories };
    }

    // Add date range filter
    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      };
    }

    // Execute search
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          tags: true,
          attributes: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.product.count({ where }),
    ]);

    // Generate facets
    const facets = await this.generateFacets(where);

    const result: SearchResult = {
      products: products as any[],
      total,
      page,
      facets,
      executionTime: Date.now() - startTime,
    };

    // Cache result
    await CacheService.set(cacheKey, result, CacheService.SEARCH_TTL);

    return result;
  }

  /**
   * Generate search facets
   */
  private static async generateFacets(where: any): Promise<SearchFacets> {
    const [categories, attributes] = await Promise.all([
      prisma.product.groupBy({
        by: ['categoryId'],
        where,
        _count: true,
      }),
      prisma.productAttribute.groupBy({
        by: ['name', 'value'],
        where: {
          product: where,
        },
        _count: true,
      }),
    ]);

    // Get category names
    const categoryIds = categories.map(c => c.categoryId);
    const categoryData = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categoryData.map(c => [c.id, c.name]));

    return {
      categories: categories.map(c => ({
        name: categoryMap.get(c.categoryId) || 'Unknown',
        count: c._count,
      })),
      attributes: attributes.reduce((acc, attr) => {
        if (!acc[attr.name]) {
          acc[attr.name] = [];
        }
        acc[attr.name].push({
          value: attr.value,
          count: attr._count,
        });
        return acc;
      }, {} as Record<string, { value: string; count: number }[]>),
    };
  }

  /**
   * Build search index (for future optimization)
   */
  static async buildSearchIndex(): Promise<void> {
    // This would create full-text search indexes
    // For now, we rely on Prisma's built-in search
    console.log('Search index built');
  }
}
