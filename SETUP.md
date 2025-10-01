# Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd docs-mcp-server
npm install
npm run build
```

### 2. Configure Claude Code

Edit `~/.config/claude-code/mcp_settings.json`:

```json
{
  "mcpServers": {
    "docs": {
      "command": "node",
      "args": ["/home/dubbinglabs/Projects/docs-mcp-server/dist/index.js"],
      "env": {
        "DOCS_PATH": "/home/dubbinglabs/Projects/video-dubbing/docs"
      }
    }
  }
}
```

**Important**: Use absolute paths, not relative paths!

### 3. Restart Claude Code

```bash
# The MCP server will start automatically when Claude Code launches
# Check that it's working by asking Claude to search docs
```

## Detailed Configuration

### Finding Your Config File

**Claude Code**:
- Linux: `~/.config/claude-code/mcp_settings.json`
- macOS: `~/Library/Application Support/claude-code/mcp_settings.json`
- Windows: `%APPDATA%\claude-code\mcp_settings.json`

**Claude Desktop**:
- Linux: `~/.config/claude-desktop/claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

### Configuration Options

```json
{
  "mcpServers": {
    "docs": {
      "command": "node",
      "args": [
        "/absolute/path/to/docs-mcp-server/dist/index.js"
      ],
      "env": {
        "DOCS_PATH": "/absolute/path/to/your/docs"
      }
    }
  }
}
```

#### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DOCS_PATH` | Yes | Absolute path to documentation directory | `../video-dubbing/docs` |

### Multiple Documentation Sources

You can configure multiple instances for different projects:

```json
{
  "mcpServers": {
    "docs-project1": {
      "command": "node",
      "args": ["/path/to/docs-mcp-server/dist/index.js"],
      "env": {
        "DOCS_PATH": "/path/to/project1/docs"
      }
    },
    "docs-project2": {
      "command": "node",
      "args": ["/path/to/docs-mcp-server/dist/index.js"],
      "env": {
        "DOCS_PATH": "/path/to/project2/docs"
      }
    }
  }
}
```

## Verifying Installation

### 1. Check Server Logs

When Claude Code starts, the MCP server logs to stderr. Look for:

```
Starting Docs MCP Server...
Documentation path: /path/to/docs
✓ Documentation directory found
Building documentation index...
Found 247 markdown files
Index built successfully
Docs MCP Server running on stdio
```

### 2. Test from Claude Code

Ask Claude:

```
Search the docs for "authentication"
```

Claude should use the `search_docs` tool and return results.

### 3. Manual Testing

You can test the server directly:

```bash
cd docs-mcp-server
DOCS_PATH=/path/to/docs node dist/index.js
```

Then send MCP protocol messages via stdin (advanced users only).

## Troubleshooting

### "Documentation directory not found"

**Problem**: Server can't find your docs folder.

**Solution**:
1. Verify `DOCS_PATH` is an absolute path (starts with `/` or `C:\`)
2. Check the directory exists: `ls /path/to/docs`
3. Ensure the path has no typos

### "No results found"

**Problem**: Search returns no results.

**Solutions**:
1. Check that your docs directory contains `.md` files
2. Try a broader search query
3. Verify index built successfully (check logs)
4. Ensure files have actual content, not empty

### "Server not appearing in Claude"

**Problem**: Claude doesn't show the MCP tools.

**Solutions**:
1. Verify JSON syntax in config file (use a JSON validator)
2. Check that paths are absolute
3. Restart Claude Code/Desktop completely
4. Check for errors in Claude's MCP logs

### "Permission denied"

**Problem**: Node can't execute the server.

**Solutions**:
```bash
chmod +x dist/index.js
# or rebuild:
npm run build
```

### "Module not found"

**Problem**: Dependencies not installed.

**Solutions**:
```bash
npm install
npm run build
```

## Updating the Server

When you update the server code:

```bash
cd docs-mcp-server
git pull  # if using git
npm install  # if dependencies changed
npm run build
# Restart Claude Code
```

The index rebuilds automatically on startup - no need to clear cache.

## Performance Tuning

### Large Documentation Sets (1000+ files)

The indexer handles large doc sets efficiently, but you can optimize:

1. **Exclude unnecessary directories**: Move non-doc markdown files outside `DOCS_PATH`
2. **Use categories**: Well-organized categories speed up filtered searches
3. **Add frontmatter**: Explicit metadata improves search accuracy

### Memory Usage

Approximate memory usage:
- 100 docs: ~1 MB
- 500 docs: ~5 MB
- 1000 docs: ~10 MB

The server is lightweight and should work on any machine running Claude.

## Development Setup

If you want to modify the server:

```bash
# Clone/create the project
cd docs-mcp-server

# Install dependencies
npm install

# Run TypeScript compiler in watch mode
npm run watch

# In another terminal, test your changes
DOCS_PATH=/path/to/docs node dist/index.js
```

Edit files in `src/`, and TypeScript will automatically recompile to `dist/`.

## Next Steps

1. ✅ Server installed and configured
2. 📝 Add frontmatter to your documentation (see README.md)
3. 🎯 Try searching with Claude Code
4. 🔗 Explore related docs feature
5. 🏷️ Browse by categories and tags

## Getting Help

Common issues are covered above. For bugs or feature requests:

1. Check the README.md for usage examples
2. Review server logs for error messages
3. Verify your configuration matches the examples
4. Test with a simple docs directory first

The server is designed to "just work" with minimal configuration - if it's not working, it's usually a path or permissions issue.
