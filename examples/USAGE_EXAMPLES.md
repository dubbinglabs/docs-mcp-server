# Usage Examples

This guide shows real-world examples of using the Docs MCP Server with Claude Code.

## Example 1: Finding Documentation for a Bug Fix

### Scenario
You're fixing an authentication bug in `login.ts` and need to understand how auth works.

### User Request
```
"I need to fix the authentication bug in login.ts"
```

### What Claude Does

**Step 1**: Search for relevant docs
```javascript
search_docs({
  query: "authentication login",
  limit: 5
})
```

**Step 2**: Claude receives:
```json
{
  "total_results": 3,
  "results": [
    {
      "path": "features/auth.md",
      "title": "Authentication Implementation",
      "summary": "OAuth 2.0 implementation with Google and GitHub providers",
      "category": "features",
      "tags": ["authentication", "oauth", "security"],
      "excerpt": "...OAuth flow handles login..."
    },
    {
      "path": "api/auth-endpoints.md",
      "title": "Authentication API Endpoints",
      "category": "api",
      "tags": ["authentication", "api"],
      "excerpt": "...POST /auth/login endpoint..."
    },
    {
      "path": "troubleshooting/auth-errors.md",
      "title": "Common Authentication Errors",
      "category": "troubleshooting",
      "tags": ["authentication", "errors"],
      "excerpt": "...invalid token error..."
    }
  ]
}
```

**Step 3**: Get the full document
```javascript
get_document({
  path: "features/auth.md"
})
```

**Step 4**: Find related docs
```javascript
get_related_docs({
  path: "features/auth.md",
  limit: 5
})
```

**Result**: Claude now has comprehensive context to fix the bug!

## Example 2: Exploring API Documentation

### Scenario
You want to understand all available API endpoints.

### User Request
```
"Show me all API documentation"
```

### What Claude Does

**Step 1**: List categories
```javascript
list_categories()
```

**Response**:
```json
{
  "total": 8,
  "categories": [
    "api",
    "features",
    "architecture",
    "database",
    "deployment",
    "troubleshooting",
    "guides",
    "reference"
  ]
}
```

**Step 2**: Search within API category
```javascript
search_docs({
  query: "endpoints",
  category: "api",
  limit: 20
})
```

**Result**: Complete list of API documentation!

## Example 3: Finding Security-Related Documentation

### Scenario
You're doing a security audit and need all security docs.

### User Request
```
"Find all documentation related to security"
```

### What Claude Does

**Step 1**: Search by tag
```javascript
list_tags()
```

**Response**:
```json
{
  "total": 47,
  "tags": [
    "authentication",
    "authorization",
    "encryption",
    "security",
    "oauth",
    "jwt",
    ...
  ]
}
```

**Step 2**: Search with security tags
```javascript
search_docs({
  query: "security",
  tags: ["security"],
  limit: 20
})
```

**Alternative**: Search with multiple tags
```javascript
search_docs({
  query: "authentication security",
  tags: ["authentication", "security"],
  limit: 10
})
```

**Result**: All docs tagged with security!

## Example 4: Understanding Database Schema

### Scenario
You're adding a new field to the users table.

### User Request
```
"I need to add an 'avatar_url' field to the users table"
```

### What Claude Does

**Step 1**: Search for database docs
```javascript
search_docs({
  query: "users table schema",
  category: "database"
})
```

**Step 2**: Get the document
```javascript
get_document({
  path: "database/users.md"
})
```

**Step 3**: Find related database docs
```javascript
get_related_docs({
  path: "database/users.md"
})
```

**Result**: Claude has:
- Users table schema
- Migration guidelines
- Related tables (sessions, profiles)
- Best practices for schema changes

## Example 5: Following Documentation Relationships

### Scenario
You're implementing a new feature and want to understand the full architecture.

### User Request
```
"Explain the video processing architecture"
```

### What Claude Does

**Step 1**: Search for architecture docs
```javascript
search_docs({
  query: "video processing architecture"
})
```

**Step 2**: Get the main doc
```javascript
get_document({
  path: "architecture/video-processing.md"
})
```

**Step 3**: Follow relationships
```javascript
get_related_docs({
  path: "architecture/video-processing.md"
})
```

**Response**:
```json
{
  "source": "architecture/video-processing.md",
  "total_related": 6,
  "related": [
    {
      "path": "features/video-upload.md",
      "title": "Video Upload Feature",
      "category": "features"
    },
    {
      "path": "api/video-endpoints.md",
      "title": "Video API Endpoints",
      "category": "api"
    },
    {
      "path": "database/videos.md",
      "title": "Videos Database Schema",
      "category": "database"
    },
    {
      "path": "architecture/job-queue.md",
      "title": "Job Queue System",
      "category": "architecture"
    }
  ]
}
```

**Step 4**: Claude can now read each related doc to build complete understanding!

## Example 6: Debugging with Troubleshooting Docs

### Scenario
You're getting a specific error message.

### User Request
```
"I'm getting error: 'Invalid refresh token' - how do I fix this?"
```

### What Claude Does

**Step 1**: Search troubleshooting docs
```javascript
search_docs({
  query: "invalid refresh token error",
  category: "troubleshooting"
})
```

**Step 2**: Get the troubleshooting guide
```javascript
get_document({
  path: "troubleshooting/auth-errors.md"
})
```

**Result**: Claude finds the exact error and solution!

## Example 7: Researching Before Implementation

### Scenario
You want to add a new feature but need to understand existing patterns.

### User Request
```
"I want to add real-time notifications. How do we handle real-time features?"
```

### What Claude Does

**Step 1**: Search for similar features
```javascript
search_docs({
  query: "real-time websocket events"
})
```

**Step 2**: Browse architecture docs
```javascript
search_docs({
  query: "architecture patterns",
  category: "architecture"
})
```

**Step 3**: Check for related implementation guides
```javascript
search_docs({
  query: "implementation guide",
  category: "guides"
})
```

**Result**: Claude understands your architecture patterns and can propose consistent implementation!

## Example 8: Combining Multiple Searches

### Scenario
Complex feature requiring understanding of multiple systems.

### User Request
```
"I need to implement admin dashboard analytics showing user activity"
```

### What Claude Does

**Parallel searches**:

```javascript
// Search 1: Dashboard implementation
search_docs({ query: "dashboard frontend", category: "features" })

// Search 2: Analytics system
search_docs({ query: "analytics metrics" })

// Search 3: User data access
search_docs({ query: "user activity data", category: "database" })

// Search 4: Admin permissions
search_docs({ query: "admin authorization permissions" })
```

**Result**: Claude gets comprehensive cross-cutting context!

## Tips for Best Results

### 1. Use Specific Keywords
- ❌ "How does it work?"
- ✅ "How does authentication work?"

### 2. Leverage Categories
```javascript
// Instead of broad search
search_docs({ query: "errors" })

// Use category filter
search_docs({ query: "errors", category: "troubleshooting" })
```

### 3. Combine Tags for Precision
```javascript
// Very specific search
search_docs({
  query: "security implementation",
  tags: ["authentication", "encryption"]
})
```

### 4. Follow the Relationship Chain
```javascript
// 1. Find main doc
search_docs({ query: "feature X" })

// 2. Get related docs
get_related_docs({ path: "features/feature-x.md" })

// 3. Read each related doc for complete picture
```

### 5. Browse Structure First
```javascript
// Understand organization
list_categories()
list_tags()

// Then targeted search
search_docs({ query: "...", category: "...", tags: ["..."] })
```

## Real-World Workflow

### Complete Feature Implementation

1. **Research phase**:
   ```javascript
   search_docs({ query: "similar feature existing" })
   list_categories()  // understand structure
   ```

2. **Architecture understanding**:
   ```javascript
   search_docs({ query: "architecture patterns", category: "architecture" })
   get_related_docs({ path: "found-doc.md" })
   ```

3. **Implementation details**:
   ```javascript
   search_docs({ query: "api implementation", category: "api" })
   search_docs({ query: "database schema", category: "database" })
   ```

4. **Testing and validation**:
   ```javascript
   search_docs({ query: "testing guidelines", category: "guides" })
   ```

5. **Troubleshooting**:
   ```javascript
   search_docs({ query: "common errors", category: "troubleshooting" })
   ```

With the Docs MCP Server, Claude has instant access to your entire knowledge base, making it a true expert in your codebase!
