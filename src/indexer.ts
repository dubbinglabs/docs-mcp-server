import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Document, DocumentIndex, DocumentMetadata } from './types.js';
import natural from 'natural';

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

export class DocumentIndexer {
  private index: DocumentIndex;
  private docsPath: string;

  constructor(docsPath: string) {
    this.docsPath = docsPath;
    this.index = {
      documents: new Map(),
      keywords: new Map(),
      categories: new Map(),
      tags: new Map(),
      tfidf: new Map(),
      relationships: new Map(),
    };
  }

  async buildIndex(): Promise<void> {
    console.error('Building documentation index...');

    // Reset index
    this.index = {
      documents: new Map(),
      keywords: new Map(),
      categories: new Map(),
      tags: new Map(),
      tfidf: new Map(),
      relationships: new Map(),
    };

    const files = await this.findMarkdownFiles(this.docsPath);
    console.error(`Found ${files.length} markdown files`);

    // Parse all documents
    for (const filePath of files) {
      await this.indexDocument(filePath);
    }

    // Build TF-IDF index
    this.buildTfIdfIndex();

    // Build relationship map
    this.buildRelationships();

    console.error('Index built successfully');
  }

  private async findMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          files.push(...await this.findMarkdownFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or no permission
      console.error(`Warning: Could not read directory ${dir}:`, error);
    }

    return files;
  }

  private async indexDocument(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const stats = await fs.stat(filePath);
      const parsed = matter(content);

      const metadata: DocumentMetadata = {
        title: parsed.data.title || this.extractTitleFromPath(filePath),
        tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : [],
        category: parsed.data.category || this.extractCategoryFromPath(filePath),
        related: Array.isArray(parsed.data.related) ? parsed.data.related : [],
        summary: parsed.data.summary || this.extractFirstParagraph(parsed.content),
        ...parsed.data,
      };

      const doc: Document = {
        path: this.getRelativePath(filePath),
        content: parsed.content,
        metadata,
        lastModified: stats.mtimeMs,
      };

      this.index.documents.set(doc.path, doc);

      // Index keywords
      this.indexKeywords(doc);

      // Index category
      if (metadata.category) {
        if (!this.index.categories.has(metadata.category)) {
          this.index.categories.set(metadata.category, new Set());
        }
        this.index.categories.get(metadata.category)!.add(doc.path);
      }

      // Index tags
      if (metadata.tags) {
        for (const tag of metadata.tags) {
          if (!this.index.tags.has(tag)) {
            this.index.tags.set(tag, new Set());
          }
          this.index.tags.get(tag)!.add(doc.path);
        }
      }
    } catch (error) {
      console.error(`Error indexing ${filePath}:`, error);
    }
  }

  private indexKeywords(doc: Document): void {
    const text = `${doc.metadata.title} ${doc.metadata.summary} ${doc.content}`.toLowerCase();
    const tokens = tokenizer.tokenize(text) || [];

    for (const token of tokens) {
      if (token.length > 2) { // Skip very short words
        if (!this.index.keywords.has(token)) {
          this.index.keywords.set(token, new Set());
        }
        this.index.keywords.get(token)!.add(doc.path);
      }
    }
  }

  private buildTfIdfIndex(): void {
    const tfidf = new TfIdf();

    // Add all documents to TF-IDF
    const docPaths: string[] = [];
    for (const [path, doc] of this.index.documents) {
      const text = `${doc.metadata.title} ${doc.metadata.summary} ${doc.content}`;
      tfidf.addDocument(text);
      docPaths.push(path);
    }

    // Build TF-IDF scores for each document
    docPaths.forEach((docPath, docIndex) => {
      const scores = new Map<string, number>();

      tfidf.listTerms(docIndex).forEach((item: any) => {
        scores.set(item.term, item.tfidf);
      });

      this.index.tfidf.set(docPath, scores);
    });
  }

  private buildRelationships(): void {
    for (const [docPath, doc] of this.index.documents) {
      const related = new Set<string>();

      // Add explicit relationships from frontmatter
      if (doc.metadata.related) {
        for (const rel of doc.metadata.related) {
          const normalizedRel = this.normalizePath(rel);
          if (this.index.documents.has(normalizedRel)) {
            related.add(normalizedRel);
          }
        }
      }

      // Add implicit relationships (same category/tags)
      for (const [otherPath, otherDoc] of this.index.documents) {
        if (otherPath === docPath) continue;

        // Same category
        if (doc.metadata.category && doc.metadata.category === otherDoc.metadata.category) {
          related.add(otherPath);
        }

        // Shared tags
        const sharedTags = doc.metadata.tags?.filter(tag =>
          otherDoc.metadata.tags?.includes(tag)
        ) || [];

        if (sharedTags.length >= 2) {
          related.add(otherPath);
        }
      }

      // Extract links from content
      const linkRegex = /\[([^\]]+)\]\(([^)]+\.md)\)/g;
      let match;
      while ((match = linkRegex.exec(doc.content)) !== null) {
        const linkedPath = this.normalizePath(match[2]);
        if (this.index.documents.has(linkedPath)) {
          related.add(linkedPath);
        }
      }

      this.index.relationships.set(docPath, related);
    }
  }

  private extractTitleFromPath(filePath: string): string {
    const basename = path.basename(filePath, '.md');
    return basename
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private extractCategoryFromPath(filePath: string): string {
    const relativePath = this.getRelativePath(filePath);
    const parts = relativePath.split(path.sep);

    if (parts.length > 1) {
      return parts[parts.length - 2];
    }

    return 'general';
  }

  private extractFirstParagraph(content: string): string {
    const paragraphs = content.split('\n\n');
    for (const para of paragraphs) {
      const cleaned = para.trim().replace(/^#+\s+/, '');
      if (cleaned.length > 20) {
        return cleaned.slice(0, 200);
      }
    }
    return '';
  }

  private getRelativePath(filePath: string): string {
    return path.relative(this.docsPath, filePath);
  }

  private normalizePath(docPath: string): string {
    // Handle both absolute and relative paths in frontmatter
    if (path.isAbsolute(docPath)) {
      return this.getRelativePath(docPath);
    }

    // Remove leading ./ or ../
    return docPath.replace(/^\.\.?\//, '');
  }

  getIndex(): DocumentIndex {
    return this.index;
  }

  getDocument(docPath: string): Document | undefined {
    return this.index.documents.get(docPath);
  }

  search(query: string, category?: string, tags?: string[]): string[] {
    const queryTokens = tokenizer.tokenize(query.toLowerCase()) || [];
    const scores = new Map<string, number>();

    // Calculate relevance scores
    for (const [docPath, doc] of this.index.documents) {
      // Filter by category
      if (category && doc.metadata.category !== category) {
        continue;
      }

      // Filter by tags
      if (tags && tags.length > 0) {
        const hasAllTags = tags.every(tag => doc.metadata.tags?.includes(tag));
        if (!hasAllTags) {
          continue;
        }
      }

      let score = 0;

      // Keyword matching
      for (const token of queryTokens) {
        if (this.index.keywords.has(token) && this.index.keywords.get(token)!.has(docPath)) {
          score += 1;
        }
      }

      // TF-IDF scoring
      const tfidfScores = this.index.tfidf.get(docPath);
      if (tfidfScores) {
        for (const token of queryTokens) {
          score += tfidfScores.get(token) || 0;
        }
      }

      // Title match bonus
      const titleLower = doc.metadata.title?.toLowerCase() || '';
      for (const token of queryTokens) {
        if (titleLower.includes(token)) {
          score += 5;
        }
      }

      // Tag match bonus
      for (const token of queryTokens) {
        if (doc.metadata.tags?.some(tag => tag.toLowerCase().includes(token))) {
          score += 3;
        }
      }

      if (score > 0) {
        scores.set(docPath, score);
      }
    }

    // Sort by relevance
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([path]) => path);
  }

  getRelatedDocuments(docPath: string, limit: number = 10): string[] {
    const related = this.index.relationships.get(docPath);
    if (!related || related.size === 0) {
      return [];
    }

    // Score related docs by number of connections
    const scores = new Map<string, number>();
    const doc = this.index.documents.get(docPath);

    for (const relPath of related) {
      let score = 1;
      const relDoc = this.index.documents.get(relPath);

      if (relDoc && doc) {
        // Boost score for same category
        if (doc.metadata.category === relDoc.metadata.category) {
          score += 2;
        }

        // Boost score for shared tags
        const sharedTags = doc.metadata.tags?.filter(tag =>
          relDoc.metadata.tags?.includes(tag)
        ) || [];
        score += sharedTags.length;

        // Boost for explicit relationships
        if (doc.metadata.related?.includes(relPath)) {
          score += 5;
        }
      }

      scores.set(relPath, score);
    }

    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([path]) => path);
  }

  getCategories(): string[] {
    return Array.from(this.index.categories.keys()).sort();
  }

  getTags(): string[] {
    return Array.from(this.index.tags.keys()).sort();
  }
}
