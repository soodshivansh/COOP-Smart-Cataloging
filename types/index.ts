// User types
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'viewer';
  twoFactorEnabled: boolean;
  createdAt: Date;
  lastLogin: Date | null;
}

// Product types
export interface Product {
  id: string;
  imageUrl: string;
  description: string;
  categoryId: string;
  category?: Category;
  tags: ProductTag[];
  attributes: ProductAttribute[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  version: number;
  archived: boolean;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  createdAt: Date;
}

export interface ProductTag {
  id: string;
  productId: string;
  tag: string;
  confidence: number;
  source: 'ai' | 'user' | 'bulk';
  createdAt: Date;
}

export interface ProductAttribute {
  id: string;
  productId: string;
  name: string;
  value: string;
  confidence: number;
  source: 'image' | 'text' | 'user';
  createdAt: Date;
}

// AI Analysis types
export interface AnalysisResult {
  categories: CategorySuggestion[];
  tags: TagSuggestion[];
  attributes: AttributeSuggestion[];
  title?: string;
  processingTime: number;
  cached?: boolean;
}

export interface HealthScore {
  score: number; // 0-100
  total: number;
  missingTitle: number;
  missingTags: number;
  missingAttributes: number;
  archived: number;
}

export interface CategorySuggestion {
  name: string;
  confidence: number;
  isPrimary: boolean;
}

export interface TagSuggestion {
  name: string;
  confidence: number;
}

export interface AttributeSuggestion {
  name: string;
  value: string;
  confidence: number;
  source: 'image' | 'text' | 'both';
}

export interface SmartSuggestion {
  id: string;
  type: 'category' | 'tag' | 'attribute';
  value: string;
  confidence: number;
  field: string;
}

// Search types
export interface SearchResult {
  products: Product[];
  total: number;
  page: number;
  facets: SearchFacets;
  executionTime: number;
}

export interface SearchFacets {
  categories: { name: string; count: number }[];
  attributes: Record<string, { value: string; count: number }[]>;
}

export interface FilterOptions {
  categories?: string[];
  attributes?: Record<string, string[]>;
  dateRange?: { start: Date; end: Date };
}

// Bulk upload types
export interface UploadSummary {
  total: number;
  successful: number;
  failed: number;
  pendingReview: number;
  errors: UploadError[];
}

export interface UploadError {
  row: number;
  field: string;
  message: string;
}

export interface ProgressUpdate {
  processed: number;
  total: number;
  currentItem: string;
}
