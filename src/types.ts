export interface DocumentMetadata {
  title?: string;
  tags?: string[];
  category?: string;
  related?: string[];
  summary?: string;
  [key: string]: any;
}

export interface Document {
  path: string;
  content: string;
  metadata: DocumentMetadata;
  lastModified: number;
}

export interface SearchResult {
  path: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  relevance: number;
  excerpt?: string;
}

export interface DocumentIndex {
  documents: Map<string, Document>;
  keywords: Map<string, Set<string>>;
  categories: Map<string, Set<string>>;
  tags: Map<string, Set<string>>;
  tfidf: Map<string, Map<string, number>>;
  relationships: Map<string, Set<string>>;
}
