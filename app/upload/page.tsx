'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AIReviewPanel from '@/components/AIReviewPanel';
import type { AnalysisResult } from '@/types';

export default function UploadPage() {
  const router = useRouter();
  const [image, setImage] = useState<string>('');
  const [description, setDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image || !description) {
      setError('Please provide both image and description');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, description }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      setAnalysis(data.suggestions);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze product');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreateProduct = async (finalData: any) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: image,
          description,
          ...finalData,
        }),
      });

      if (!response.ok) throw new Error('Failed to create product');

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
    }
  };

  return (
    <div className="min-h-screen bg-background-primary">
      <header className="border-b border-border-default bg-background-secondary">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Add New Product</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-background-tertiary hover:bg-background-hover rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {error && (
          <div className="mb-6 p-4 bg-accent-error/10 border border-accent-error rounded-lg text-accent-error">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Product Image</label>
            <div className="border-2 border-dashed border-border-default rounded-lg p-8 text-center hover:border-accent-primary transition-colors">
              {image ? (
                <div className="relative w-full h-64">
                  <img src={image} alt="Preview" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div>
                  <svg
                    className="mx-auto h-12 w-12 text-text-tertiary"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-text-secondary">
                    Click to upload or drag and drop
                  </p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="mt-4 inline-block px-4 py-2 bg-accent-primary hover:bg-accent-primaryHover rounded-lg cursor-pointer transition-colors"
              >
                Choose Image
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Product Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-background-secondary border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
              placeholder="Describe the product..."
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || !image || !description}
            className="w-full py-3 bg-accent-primary hover:bg-accent-primaryHover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {analyzing ? 'Analyzing...' : 'Analyze with AI'}
          </button>

          {analysis && (
            <AIReviewPanel
              analysis={analysis}
              onConfirm={handleCreateProduct}
            />
          )}
        </div>
      </main>
    </div>
  );
}
