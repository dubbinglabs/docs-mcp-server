# Frontmatter Migration Guide

This guide helps you add frontmatter to existing documentation for better organization and searchability.

## Why Add Frontmatter?

Benefits:
- ✅ Better search results (explicit metadata)
- ✅ Automatic categorization
- ✅ Document relationships
- ✅ Improved context for Claude
- ✅ Future-proof documentation

## Basic Template

```markdown
---
title: Your Document Title
tags: [tag1, tag2, tag3]
category: category-name
summary: Brief one-sentence description
---

# Your Document Title

Content here...
```

## Field Guidelines

### Title
- **Purpose**: Main document heading
- **Auto-generated**: Yes (from filename if missing)
- **Best practice**: Use clear, descriptive titles

```yaml
# Good
title: Authentication Implementation Guide

# Avoid
title: Auth
```

### Tags
- **Purpose**: Categorize and filter documents
- **Auto-generated**: No
- **Best practice**: 3-7 relevant tags per document

```yaml
# Good - specific and useful
tags: [authentication, oauth, security, backend, jwt]

# Too broad
tags: [code, docs, info]

# Too many
tags: [auth, authentication, oauth, oauth2, security, secure, login, signin, signup, user, users, backend, api, jwt, token, tokens, session, sessions]
```

#### Suggested Tag Categories

**Technical domains**:
- `frontend`, `backend`, `database`, `api`, `cli`

**Languages/Frameworks**:
- `typescript`, `react`, `node`, `postgres`, `redis`

**Features**:
- `authentication`, `authorization`, `video-processing`, `analytics`

**Concerns**:
- `security`, `performance`, `testing`, `deployment`, `monitoring`

**Types**:
- `guide`, `reference`, `troubleshooting`, `architecture`, `api-docs`

### Category
- **Purpose**: Primary grouping for documentation
- **Auto-generated**: Yes (from directory structure)
- **Best practice**: Use consistent categories across docs

```yaml
# Common categories
category: features        # Feature documentation
category: api            # API reference
category: architecture   # System design
category: database       # Schema and queries
category: deployment     # Deployment guides
category: troubleshooting # Error solutions
category: guides         # How-to guides
category: reference      # Reference material
```

### Summary
- **Purpose**: Brief description for search results
- **Auto-generated**: Yes (from first paragraph)
- **Best practice**: One clear sentence

```yaml
# Good - concise and informative
summary: OAuth 2.0 implementation with Google and GitHub providers supporting automatic token refresh

# Too vague
summary: This document explains authentication

# Too long
summary: This is a comprehensive guide that covers every aspect of our authentication system including OAuth providers, token management, session handling, security considerations, implementation details, and troubleshooting steps for common issues
```

### Related (Optional)
- **Purpose**: Explicit document relationships
- **Auto-generated**: Partially (from links and shared tags)
- **Best practice**: Link to directly related docs

```yaml
related:
  - api/auth-endpoints.md
  - database/users.md
  - troubleshooting/auth-errors.md
```

**Note**: Use paths relative to docs root, or use `docs/` prefix

## Migration Strategy

### Step 1: Start with High-Traffic Docs

Add frontmatter to most-accessed documentation first:
1. Main feature docs
2. API references
3. Troubleshooting guides
4. Architecture overviews

### Step 2: Batch Process by Category

Migrate one category at a time:

```bash
# Example: All feature docs
docs/features/
  ├── auth.md          ✅ Add frontmatter
  ├── video-upload.md  ✅ Add frontmatter
  └── analytics.md     ✅ Add frontmatter
```

### Step 3: Add Relationships

After basic frontmatter, add `related` fields:

```yaml
# In auth.md
related:
  - api/auth-endpoints.md
  - database/users.md

# In auth-endpoints.md
related:
  - features/auth.md
  - troubleshooting/auth-errors.md
```

### Step 4: Validate and Test

Test searches to ensure metadata improves results:

```javascript
search_docs({ query: "authentication" })
// Should now return better-ranked results
```

## Common Patterns

### Feature Documentation

```yaml
---
title: Video Processing Pipeline
tags: [video-processing, encoding, pipeline, backend]
category: features
related:
  - api/video-endpoints.md
  - architecture/job-queue.md
  - database/videos.md
summary: Async video processing pipeline handling upload, encoding, and delivery
---
```

### API Documentation

```yaml
---
title: Authentication API Endpoints
tags: [api, authentication, rest, endpoints]
category: api
related:
  - features/auth.md
  - reference/api-conventions.md
summary: REST API endpoints for authentication including login, logout, and token refresh
---
```

### Troubleshooting Guides

```yaml
---
title: Common Authentication Errors
tags: [troubleshooting, authentication, errors, debugging]
category: troubleshooting
related:
  - features/auth.md
  - api/auth-endpoints.md
summary: Solutions for common authentication errors including token expiration and invalid credentials
---
```

### Architecture Documentation

```yaml
---
title: Microservices Architecture Overview
tags: [architecture, microservices, design, system-design]
category: architecture
related:
  - architecture/service-communication.md
  - deployment/kubernetes.md
  - guides/service-development.md
summary: High-level overview of our microservices architecture including service boundaries and communication patterns
---
```

### Database Documentation

```yaml
---
title: Users Table Schema
tags: [database, schema, postgres, users]
category: database
related:
  - database/sessions.md
  - database/migrations.md
  - features/auth.md
summary: Users table schema including fields, indexes, and relationships
---
```

## Automation Tools

### Bash Script for Batch Processing

```bash
#!/bin/bash
# add-frontmatter.sh

for file in docs/**/*.md; do
  if ! grep -q "^---" "$file"; then
    echo "Adding frontmatter to $file"

    # Extract title from first heading
    title=$(grep -m 1 "^# " "$file" | sed 's/^# //')

    # Infer category from path
    category=$(dirname "$file" | sed 's|^docs/||')

    # Create temporary file with frontmatter
    cat > temp.md <<EOF
---
title: $title
tags: []
category: $category
summary:
---

EOF

    # Append original content
    cat "$file" >> temp.md
    mv temp.md "$file"
  fi
done
```

### Node.js Script

```javascript
// migrate-frontmatter.js
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

async function addFrontmatter(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf-8');

  // Check if frontmatter already exists
  if (content.startsWith('---')) {
    return;
  }

  // Extract title from first heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');

  // Infer category from directory
  const category = path.dirname(filePath).split(path.sep).pop();

  // Add frontmatter
  const withFrontmatter = matter.stringify(content, {
    title,
    tags: [],
    category,
    summary: '',
  });

  await fs.promises.writeFile(filePath, withFrontmatter);
  console.log(`✅ Updated ${filePath}`);
}

// Usage: node migrate-frontmatter.js docs/
const docsDir = process.argv[2];
// Recursively process all .md files...
```

## Quality Checklist

After adding frontmatter, verify:

- [ ] Title is descriptive and clear
- [ ] 3-7 relevant tags per document
- [ ] Category matches doc content
- [ ] Summary is one clear sentence
- [ ] Related docs actually exist
- [ ] YAML syntax is valid (no syntax errors)
- [ ] Related paths are correct (relative to docs root)

## Testing Your Frontmatter

```javascript
// Test 1: Can you find this doc?
search_docs({ query: "main topic keyword" })

// Test 2: Category filtering works?
search_docs({ query: "topic", category: "your-category" })

// Test 3: Tag filtering works?
search_docs({ query: "topic", tags: ["your-tag"] })

// Test 4: Related docs appear?
get_related_docs({ path: "your-doc.md" })
```

## Gradual Migration

You don't need to migrate everything at once:

1. **Week 1**: Feature docs + API docs
2. **Week 2**: Troubleshooting + Architecture
3. **Week 3**: Database + Deployment
4. **Week 4**: Guides + Reference
5. **Ongoing**: Update as you create/edit docs

The MCP server works with partial frontmatter - it auto-generates missing fields.

## Best Practices

### DO
- ✅ Keep tags specific and relevant
- ✅ Use consistent category names
- ✅ Write clear, concise summaries
- ✅ Link to directly related docs
- ✅ Update frontmatter when doc changes

### DON'T
- ❌ Over-tag (more than 10 tags)
- ❌ Use vague tags like "info" or "docs"
- ❌ Write long summaries (keep under 200 chars)
- ❌ Link to every remotely related doc
- ❌ Forget to validate YAML syntax

## Result

After migration, you'll have:
- 🎯 More accurate search results
- 🔗 Better document relationships
- 🏷️ Useful categorization
- 📊 Clearer documentation structure
- 🤖 Claude with better context

Your documentation becomes a true knowledge graph!
