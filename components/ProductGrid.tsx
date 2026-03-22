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
  const [improving, setImproving] = useState(false);
  const [improvedDesc, setImprovedDesc] = useState('');
  const [showSimilar, setShowSimilar] = useState(false);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  const handleImprove = async () => {
    setImproving(true);
    try {
      const res = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: product.description }),
      });
      const data = await res.json();
      setImprovedDesc(data.improved || '');
    } catch {
      // silently fail
    } finally {
      setImproving(false);
    }
  };

  const handleShowSimilar = async () => {
    setShowSimilar(true);
    setLoadingSimilar(true);
    try {
      const res = await fetch(`/api/products/similar?id=${product.id}`);
      const data = await res.json();
      setSimilar(data.products || []);
    } catch {
      setSimilar([]);
    } finally {
      setLoadingSimilar(false);
    }
  };

  return (
    <>
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
            {improvedDesc || product.description}
          </p>

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
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

          <button
            onClick={handleShowSimilar}
            className="text-xs text-accent-primary hover:underline mb-2 block"
          >
            Similar products
          </button>

          {isHovered && isAdmin && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleImprove}
                disabled={improving}
                className="flex-1 px-3 py-1.5 bg-accent-primary hover:bg-accent-primaryHover disabled:opacity-50 rounded text-sm transition-colors"
              >
                {improving ? '...' : '✨ Improve'}
              </button>
              <button className="flex-1 px-3 py-1.5 bg-accent-error/10 hover:bg-accent-error/20 text-accent-error rounded text-sm transition-colors">
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Similar Products Modal */}
      {showSimilar && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSimilar(false)}
        >
          <div
            className="bg-background-secondary rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Similar Products</h3>
              <button onClick={() => setShowSimilar(false)} className="text-text-secondary hover:text-white">✕</button>
            </div>
            {loadingSimilar ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
              </div>
            ) : similar.length === 0 ? (
              <p className="text-text-secondary text-sm text-center py-8">No similar products found</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {similar.map((p) => (
                  <div key={p.id} className="bg-background-tertiary rounded-lg overflow-hidden">
                    <div className="relative aspect-video">
                      <Image src={p.imageUrl} alt={p.description} fill className="object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-text-secondary line-clamp-2">{p.description}</p>
                      {p.category && (
                        <span className="text-xs text-accent-primary mt-1 block">{p.category.name}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
