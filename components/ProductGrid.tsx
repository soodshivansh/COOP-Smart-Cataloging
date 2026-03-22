'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import type { Product } from '@/types';

interface ProductGridProps {
  products: Product[];
  onRefresh: () => void;
}

export default function ProductGrid({ products, onRefresh }: ProductGridProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary text-lg">No products found</p>
        <p className="text-text-tertiary mt-2">Start by adding your first product</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onUpdate={onRefresh} isAdmin={isAdmin} />
      ))}
    </div>
  );
}

function ProductCard({ product, onUpdate, isAdmin }: { product: Product; onUpdate: () => void; isAdmin: boolean }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="bg-background-secondary rounded-lg overflow-hidden border border-border-default hover:border-accent-primary transition-all duration-200 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-video bg-background-tertiary">
        <Image
          src={product.imageUrl}
          alt={product.description}
          fill
          className="object-cover"
        />
        {product.category && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-background-primary/80 backdrop-blur-sm rounded text-xs">
            {product.category.name}
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-sm text-text-secondary line-clamp-2 mb-3">
          {product.description}
        </p>

        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {product.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-1 bg-background-tertiary rounded-full text-xs text-text-secondary"
              >
                {tag.tag}
              </span>
            ))}
          </div>
        )}

        {isHovered && isAdmin && (
          <div className="mt-4 flex gap-2">
            <button className="flex-1 px-3 py-1.5 bg-accent-primary hover:bg-accent-primaryHover rounded text-sm transition-colors">
              Edit
            </button>
            <button className="flex-1 px-3 py-1.5 bg-accent-error/10 hover:bg-accent-error/20 text-accent-error rounded text-sm transition-colors">
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
