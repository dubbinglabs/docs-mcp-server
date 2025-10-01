#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { DocumentIndexer } from './indexer.js';
import { SearchResult } from './types.js';
import path from 'path';
import { promises as fs } from 'fs';

const DOCS_PATH_ENV = 'DOCS_PATH';
const DEFAULT_DOCS_PATH = '../video-dubbing/docs';

class DocsServer {
  private server: Server;
  private indexer: DocumentIndexer;
  private docsPath: string;

  constructor() {
    this.docsPath = process.env[DOCS_PATH_ENV] || DEFAULT_DOCS_PATH;

    // Resolve to absolute path
    if (!path.isAbsolute(this.docsPath)) {
      this.docsPath = path.resolve(process.cwd(), this.docsPath);
    }

    this.indexer = new DocumentIndexer(this.docsPath);

    this.server = new Server(
      {
        name: 'docs-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_docs':
            return await this.searchDocs(
              args?.query as string,
              args?.category as string | undefined,
              args?.tags as string[] | undefined,
              args?.limit as number | undefined
            );

          case 'get_document':
            return await this.getDocument(args?.path as string);

          case 'get_related_docs':
            return await this.getRelatedDocs(
              args?.path as string,
              args?.limit as number | undefined
            );

          case 'list_categories':
            return await this.listCategories();

          case 'list_tags':
            return await this.listTags();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'search_docs',
        description: 'Search documentation by keywords with optional filtering by category and tags. Returns ranked results based on relevance using TF-IDF scoring.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (keywords to search for)',
            },
            category: {
              type: 'string',
              description: 'Optional: filter by category (e.g., "features", "api", "troubleshooting")',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional: filter by tags (documents must have ALL specified tags)',
            },
            limit: {
              type: 'number',
              description: 'Optional: maximum number of results to return (default: 10)',
              default: 10,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_document',
        description: 'Retrieve the full content of a specific document by its path.',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Relative path to the document (as returned by search_docs)',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'get_related_docs',
        description: 'Find documents related to a specific document based on categories, tags, and explicit relationships defined in frontmatter.',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Relative path to the document',
            },
            limit: {
              type: 'number',
              description: 'Optional: maximum number of related documents to return (default: 10)',
              default: 10,
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'list_categories',
        description: 'List all available documentation categories.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_tags',
        description: 'List all available tags used in the documentation.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  private async searchDocs(
    query: string,
    category?: string,
    tags?: string[],
    limit: number = 10
  ) {
    if (!query) {
      throw new Error('Query parameter is required');
    }

    const resultPaths = this.indexer.search(query, category, tags);
    const results: SearchResult[] = [];

    for (const docPath of resultPaths.slice(0, limit)) {
      const doc = this.indexer.getDocument(docPath);
      if (doc) {
        results.push({
          path: doc.path,
          title: doc.metadata.title || '',
          summary: doc.metadata.summary || '',
          category: doc.metadata.category || '',
          tags: doc.metadata.tags || [],
          relevance: 1.0,
          excerpt: this.extractExcerpt(doc.content, query),
        });
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              query,
              filters: { category, tags },
              total_results: results.length,
              results,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async getDocument(docPath: string) {
    if (!docPath) {
      throw new Error('Path parameter is required');
    }

    const doc = this.indexer.getDocument(docPath);
    if (!doc) {
      throw new Error(`Document not found: ${docPath}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              path: doc.path,
              title: doc.metadata.title,
              category: doc.metadata.category,
              tags: doc.metadata.tags,
              summary: doc.metadata.summary,
              related: doc.metadata.related,
              content: doc.content,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async getRelatedDocs(docPath: string, limit: number = 10) {
    if (!docPath) {
      throw new Error('Path parameter is required');
    }

    const doc = this.indexer.getDocument(docPath);
    if (!doc) {
      throw new Error(`Document not found: ${docPath}`);
    }

    const relatedPaths = this.indexer.getRelatedDocuments(docPath, limit);
    const related: SearchResult[] = [];

    for (const relPath of relatedPaths) {
      const relDoc = this.indexer.getDocument(relPath);
      if (relDoc) {
        related.push({
          path: relDoc.path,
          title: relDoc.metadata.title || '',
          summary: relDoc.metadata.summary || '',
          category: relDoc.metadata.category || '',
          tags: relDoc.metadata.tags || [],
          relevance: 1.0,
        });
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              source: doc.path,
              total_related: related.length,
              related,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async listCategories() {
    const categories = this.indexer.getCategories();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              total: categories.length,
              categories,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async listTags() {
    const tags = this.indexer.getTags();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              total: tags.length,
              tags,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private extractExcerpt(content: string, query: string, contextLength: number = 150): string {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    const index = contentLower.indexOf(queryLower);

    if (index === -1) {
      return content.slice(0, contextLength) + '...';
    }

    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(content.length, index + query.length + contextLength / 2);

    let excerpt = content.slice(start, end);
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';

    return excerpt;
  }

  async start(): Promise<void> {
    console.error(`Starting Docs MCP Server...`);
    console.error(`Documentation path: ${this.docsPath}`);

    // Check if docs path exists
    try {
      await fs.access(this.docsPath);
      console.error(`✓ Documentation directory found`);
    } catch {
      console.error(`⚠ Warning: Documentation directory not found: ${this.docsPath}`);
      console.error(`  Set DOCS_PATH environment variable to specify the correct path`);
    }

    // Build initial index
    await this.indexer.buildIndex();

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('Docs MCP Server running on stdio');
  }
}

const server = new DocsServer();
server.start().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
