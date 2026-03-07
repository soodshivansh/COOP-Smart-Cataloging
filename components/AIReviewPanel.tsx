'use client';

import { useState } from 'react';
import type { AnalysisResult } from '@/types';

interface AIReviewPanelProps {
  analysis: AnalysisResult;
  onConfirm: (data: any) => void;
}

export default function AIReviewPanel({ analysis, onConfirm }: AIReviewPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState(
    analysis.categories[0]?.name || ''
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    analysis.tags.map(t => t.name)
  );
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(
    analysis.attributes.reduce((acc, attr) => {
      acc[attr.name] = attr.value;
      return acc;
    }, {} as Record<string, string>)
  );

  const handleConfirm = () => {
    onConfirm({
      categoryId: selectedCategory, // In real app, would map to category ID
      tags: selectedTags.map(tag => ({
        tag,
        confidence: 0.8,
        source: 'ai',
      })),
      attributes: Object.entries(selectedAttributes).map(([name, value]) => ({
        name,
        value,
        confidence: 0.8,
        source: 'ai',
      })),
    });
  };

  return (
    <div className="bg-background-secondary rounded-lg border border-border-default p-6">
      <h2 className="text-xl font-bold mb-4">AI Analysis Results</h2>
      <p className="text-text-secondary text-sm mb-6">
        Review and modify the AI suggestions before creating the product
      </p>

      <div className="space-y-6">
        {/* Categories */}
        <div>
          <h3 className="font-medium mb-3">Category</h3>
          <div className="space-y-2">
            {analysis.categories.map((cat, idx) => (
              <label
                key={idx}
                className="flex items-center gap-3 p-3 bg-background-tertiary rounded-lg cursor-pointer hover:bg-background-hover"
              >
                <input
                  type="radio"
                  checked={selectedCategory === cat.name}
                  onChange={() => setSelectedCategory(cat.name)}
                  className="w-4 h-4"
                />
                <span className="flex-1">{cat.name}</span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    cat.confidence >= 0.9
                      ? 'bg-confidence-high/20 text-confidence-high'
                      : cat.confidence >= 0.7
                      ? 'bg-confidence-medium/20 text-confidence-medium'
                      : 'bg-confidence-low/20 text-confidence-low'
                  }`}
                >
                  {Math.round(cat.confidence * 100)}%
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <h3 className="font-medium mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.tags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedTags(prev =>
                    prev.includes(tag.name)
                      ? prev.filter(t => t !== tag.name)
                      : [...prev, tag.name]
                  );
                }}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedTags.includes(tag.name)
                    ? 'bg-accent-primary text-white'
                    : 'bg-background-tertiary hover:bg-background-hover'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* Attributes */}
        <div>
          <h3 className="font-medium mb-3">Attributes</h3>
          <div className="space-y-3">
            {analysis.attributes.map((attr, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-sm text-text-secondary w-24">{attr.name}:</span>
                <input
                  type="text"
                  value={selectedAttributes[attr.name] || ''}
                  onChange={(e) =>
                    setSelectedAttributes(prev => ({
                      ...prev,
                      [attr.name]: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-1.5 bg-background-tertiary border border-border-default rounded focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          className="w-full py-3 bg-accent-success hover:bg-accent-success/90 rounded-lg font-medium transition-colors"
        >
          Create Product
        </button>
      </div>
    </div>
  );
}
