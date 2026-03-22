'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import ProductGrid from '@/components/ProductGrid';
import SearchBar from '@/components/SearchBar';
import type { Product, HealthScore } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<HealthScore | null>(null);

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    fetchProducts();
    fetchHealth();
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

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) setHealth(await res.json());
    } catch { /* non-critical */ }
  };

  const handleSearch = async (query: string) => {
    if (!query) { fetchProducts(); return; }
    try {
      let searchUrl = `/api/search?q=${encodeURIComponent(query)}`;
      try {
        const parseRes = await fetch('/api/search/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        if (parseRes.ok) {
          const parsed = await parseRes.json();
          const params = new URLSearchParams();
          params.set('q', parsed.keywords || query);
          if (parsed.categories?.length) params.set('categories', parsed.categories.join(','));
          searchUrl = `/api/search?${params.toString()}`;
        }
      } catch { /* fall back to plain search */ }
      const response = await fetch(searchUrl);
      const data = await response.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const healthColor =
    !health ? 'text-text-secondary' :
    health.score >= 80 ? 'text-green-400' :
    health.score >= 50 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-background-primary">
      <header className="border-b border-border-default bg-background-secondary">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Smart AI Cataloging</h1>
              {health && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-background-tertiary rounded-full text-sm">
                  <span className="text-text-secondary">Health</span>
                  <span className={`font-semibold ${healthColor}`}>{health.score}%</span>
                  {health.missingTags > 0 && (
                    <span className="text-xs text-yellow-400 ml-1">
                      {'\u26A0'} {health.missingTags} no tags
                    </span>
                  )}
                </div>
              )}
            </div>
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
        <div className="mb-6">
          <SearchBar onSearch={handleSearch} />
          <p className="text-xs text-text-tertiary mt-2 ml-1">
            Try natural language: &quot;blue electronics&quot; or &quot;red clothing&quot;
          </p>
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