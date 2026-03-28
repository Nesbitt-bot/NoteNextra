# NoteNextra MCP Server

MCP server for NoteNextra - AI agent for interacting with notes and content.

## Overview

This server provides AI agents with access to note content, search functionality, and serving capabilities for the NoteNextra application.

## MCP Functions

### list_notes
List all available notes.

**Response:**
```json
{
  "notes": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "slug": "string",
      "updatedAt": "ISO timestamp"
    }
  ]
}
```

### read_note
Read a specific note by slug.

**Arguments:**
- `slug`: The note slug (e.g., "getting-started")

**Response:**
```json
{
  "note": {
    "id": "string",
    "title": "string",
    "content": "markdown content",
    "slug": "string",
    "description": "string",
    "updatedAt": "ISO timestamp"
  }
}
```

### search_notes
Search notes by keywords.

**Arguments:**
- `query`: Search query string

**Response:**
```json
{
  "results": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "slug": "string",
      "relevance": 0.95
    }
  ]
}
```

### serve_note
Serve a note via HTTP endpoint for SSR rendering.

**Arguments:**
- `slug`: The note slug

**Response:**
```json
{
  "url": "http://localhost:3000/note/slug",
  "status": "ready"
}
```

## Running the Server

### Development Mode

```bash
# Start the MCP server
node mcp-worker/index.mjs

# In another terminal, start the SSR server
cd mcp-worker
npm run dev
```

### Production Mode

```bash
cd mcp-worker
npm run build
npm start
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `MCP_PORT`: MCP server port (default: 3001)
- `NOTE_PATH`: Path to notes directory (default: "../content")

### Docker

```bash
docker-compose up -d
```

## Testing

Run the test suite:

```bash
cd mcp-worker
npm test
```

## Architecture

```
NoteNextra/
├── content/           # Note content files
├── public/           # Static assets
├── mcp-worker/       # MCP server implementation
│   ├── index.mjs      # MCP server entry point
│   ├── server.mjs     # SSR server
│   ├── tests/        # Test suite
│   └── package.json  # Dependencies
└── package.json      # Root dependencies
```

## Issues Fixed

This implementation fixes:
- Content serving for `./content` directory
- Public assets serving for `./public` directory
- Note search functionality
- SSR rendering for AI agent consumption

## License

MIT