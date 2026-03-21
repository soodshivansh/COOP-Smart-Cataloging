'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import ProductGrid from '@/components/ProductGrid';
import SearchBar from '@/components/SearchBar';
import type { Product } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=20&offset=0');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query) { fetchProducts(); return; }
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary">
      <header className="border-b border-border-default bg-background-secondary">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Smart AI Cataloging</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary">{session?.user?.email}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-accent-primary/20 text-accent-primary capitalize">
                {session?.user?.role}
              </span>
              <button
                onClick={() => router.push('/settings/2fa')}
                className="px-3 py-1.5 text-sm bg-background-tertiary hover:bg-background-hover rounded-lg transition-colors"
              >
                2FA Settings
              </button>
              {isAdmin && (
                <button
                  onClick={() => router.push('/upload')}
                  className="px-4 py-2 bg-accent-primary hover:bg-accent-primaryHover rounded-lg transition-colors"
                >
                  Add Product
                </button>
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="px-3 py-1.5 text-sm bg-background-tertiary hover:bg-background-hover rounded-lg transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
          </div>
        ) : (
          <ProductGrid products={products} onRefresh={fetchProducts} />
        )}
      </main>
    </div>
  );
}
