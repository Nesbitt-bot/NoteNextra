#!/usr/bin/env node

/**
 * MCP Server for NoteNextra
 * Provides AI agents with access to note content and search functionality
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const server = new Server(
  {
    name: 'notenextra-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Configuration
const CONTENT_DIR = path.join(process.cwd(), '../content');
const PUBLIC_DIR = path.join(process.cwd(), '../public');

/**
 * List all available notes
 */
async function listNotes() {
  const notes = [];

  if (!fs.existsSync(CONTENT_DIR)) {
    return { notes: [] };
  }

  const files = fs.readdirSync(CONTENT_DIR);

  for (const file of files) {
    if (file.endsWith('.md')) {
      const filePath = path.join(CONTENT_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);

      const slug = file.replace('.md', '');

      notes.push({
        id: slug,
        title: data.title || slug,
        description: data.description || '',
        slug: slug,
        updatedAt: data.updatedAt || fs.statSync(filePath).mtime.toISOString(),
      });
    }
  }

  return { notes };
}

/**
 * Read a specific note by slug
 */
async function readNote(slug) {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Note not found: ${slug}`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    note: {
      id: slug,
      title: data.title || slug,
      content: content,
      description: data.description || '',
      slug: slug,
      updatedAt: data.updatedAt || fs.statSync(filePath).mtime.toISOString(),
    },
  };
}

/**
 * Search notes by keywords
 */
async function searchNotes(query) {
  const { notes } = await listNotes();

  const results = notes.map((note) => {
    const titleLower = note.title.toLowerCase();
    const descriptionLower = note.description.toLowerCase();
    const queryLower = query.toLowerCase();

    let relevance = 0;

    // Check title match
    if (titleLower.includes(queryLower)) {
      relevance += 1;
    }

    // Check description match
    if (descriptionLower.includes(queryLower)) {
      relevance += 0.5;
    }

    // Check content (read content if needed)
    const filePath = path.join(CONTENT_DIR, `${note.slug}.md`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.toLowerCase().includes(queryLower)) {
        relevance += 0.5;
      }
    }

    return {
      ...note,
      relevance: Math.min(relevance, 1),
    };
  });

  return {
    results: results.filter((note) => note.relevance > 0).sort((a, b) => b.relevance - a.relevance),
  };
}

/**
 * Serve a note via HTTP endpoint
 */
async function serveNote(slug) {
  const { note } = await readNote(slug);

  return {
    url: `http://localhost:3000/note/${note.slug}`,
    status: 'ready',
    note: note,
  };
}

/**
 * List tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_notes',
      description: 'List all available notes',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'read_note',
      description: 'Read a specific note by slug',
      inputSchema: {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            description: 'The note slug (e.g., "getting-started")',
          },
        },
        required: ['slug'],
      },
    },
    {
      name: 'search_notes',
      description: 'Search notes by keywords',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query string',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'serve_note',
      description: 'Serve a note via HTTP endpoint for SSR rendering',
      inputSchema: {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            description: 'The note slug',
          },
        },
        required: ['slug'],
      },
    },
  ],
}));

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_notes': {
        return await listNotes();
      }
      case 'read_note': {
        return await readNote(args.slug);
      }
      case 'search_notes': {
        return await searchNotes(args.query);
      }
      case 'serve_note': {
        return await serveNote(args.slug);
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      error: error.message,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('NoteNextra MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});