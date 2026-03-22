import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import type { Product } from '@/types';

export class ProductDataManager {
  /**
   * Create a new product
   */
  static async createProduct(
    data: {
      imageUrl: string;
      description: string;
      categoryId: string; // can be a name string or a valid ObjectId
      tags: Array<{ tag: string; confidence: number; source: string }>;
      attributes: Array<{ name: string; value: string; confidence: number; source: string }>;
    },
    userId: string
  ): Promise<Product> {
    return prisma.$transaction(async (tx) => {
      // Resolve categoryId: if it's not a 24-char hex ObjectId, treat it as a name and upsert
      let resolvedCategoryId = data.categoryId;
      if (!/^[a-f\d]{24}$/i.test(data.categoryId)) {
        const categoryName = data.categoryId.trim() || 'Uncategorized';
        const category = await tx.category.upsert({
          where: { name: categoryName },
          update: {},
          create: { name: categoryName, level: 0 },
        });
        resolvedCategoryId = category.id;
      }

      // Create product
      const product = await tx.product.create({
        data: {
          imageUrl: data.imageUrl,
          description: data.description,
          categoryId: resolvedCategoryId,
          createdBy: userId,
          version: 1,
        },
        include: {
          category: true,
          tags: true,
          attributes: true,
        },
      });

      // Create tags
      if (data.tags.length > 0) {
        await tx.productTag.createMany({
          data: data.tags.map(tag => ({
            productId: product.id,
            ...tag,
          })),
        });
      }

      // Create attributes
      if (data.attributes.length > 0) {
        await tx.productAttribute.createMany({
          data: data.attributes.map(attr => ({
            productId: product.id,
            ...attr,
          })),
        });
      }

      // Create audit log
      await createAuditLog(userId, 'create', 'product', product.id, {
        imageUrl: data.imageUrl,
        categoryId: resolvedCategoryId,
      });

      return product as Product;
    });
  }

  /**
   * Update a product
   */
  static async updateProduct(
    id: string,
    updates: Partial<Product>,
    userId: string
  ): Promise<Product> {
    return prisma.$transaction(async (tx) => {
      const currentProduct = await tx.product.findUnique({
        where: { id },
        include: { tags: true, attributes: true },
      });

      if (!currentProduct) {
        throw new Error('Product not found');
      }

      // Only pass scalar fields to Prisma — strip relations and id
      const { category, tags, attributes, id: _id, createdBy, createdAt, ...scalarUpdates } = updates as any;

      const product = await tx.product.update({
        where: { id },
        data: {
          ...scalarUpdates,
          version: currentProduct.version + 1,
          updatedAt: new Date(),
        },
        include: {
          category: true,
          tags: true,
          attributes: true,
        },
      });

      // Create version history
      await tx.productVersion.create({
        data: {
          productId: id,
          version: product.version,
          changes: JSON.stringify(this.calculateChanges(currentProduct, updates)),
          modifiedBy: userId,
        },
      });

      // Create audit log
      await createAuditLog(userId, 'update', 'product', id, { updates });

      return product as Product;
    });
  }

  /**
   * Delete a product (soft delete)
   */
  static async deleteProduct(id: string, userId: string): Promise<void> {
    await prisma.product.update({
      where: { id },
      data: { archived: true },
    });

    await createAuditLog(userId, 'delete', 'product', id, {});
  }

  /**
   * Get a product by ID
   */
  static async getProduct(id: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { id, archived: false },
      include: {
        category: true,
        tags: true,
        attributes: true,
      },
    });

    return product as Product | null;
  }

  /**
   * List products with pagination
   */
  static async listProducts(options: {
    limit?: number;
    offset?: number;
    categoryId?: string;
    archived?: boolean;
  }): Promise<{ products: Product[]; total: number }> {
    const where: any = {
      archived: options.archived ?? false,
    };

    if (options.categoryId) {
      where.categoryId = options.categoryId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          tags: true,
          attributes: true,
        },
        orderBy: { createdAt: 'desc' },
        take: options.limit || 20,
        skip: options.offset || 0,
      }),
      prisma.product.count({ where }),
    ]);

    return { products: products as Product[], total };
  }

  /**
   * Get version history for a product
   */
  static async getVersionHistory(productId: string) {
    return prisma.productVersion.findMany({
      where: { productId },
      include: {
        modifier: {
          select: {
            email: true,
            role: true,
          },
        },
      },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Batch update products
   */
  static async batchUpdate(
    productIds: string[],
    updates: Partial<Product>,
    userId: string
  ): Promise<{ updated: number }> {
    const result = await prisma.product.updateMany({
      where: {
        id: { in: productIds },
        archived: false,
      },
      data: updates,
    });

    // Create audit logs for each product
    await Promise.all(
      productIds.map(id =>
        createAuditLog(userId, 'update', 'product', id, { batchUpdate: updates })
      )
    );

    return { updated: result.count };
  }

  /**
   * Calculate changes between old and new product data
   */
  private static calculateChanges(oldProduct: any, updates: any): Record<string, any> {
    const changes: Record<string, any> = {};

    for (const [key, newValue] of Object.entries(updates)) {
      if (oldProduct[key] !== newValue) {
        changes[key] = {
          old: oldProduct[key],
          new: newValue,
        };
      }
    }

    return changes;
  }
}
