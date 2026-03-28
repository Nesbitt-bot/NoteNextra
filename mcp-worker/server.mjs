#!/usr/bin/env node

/**
 * SSR Server for NoteNextra
 * Serves notes via HTTP for SSR rendering
 */

import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

// Static public assets
app.use(express.static(path.join(process.cwd(), '../public')));

// Note content route
app.get('/note/:slug', async (req, res) => {
  const slug = req.params.slug;
  const filePath = path.join(process.cwd(), '../content', `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Note not found' });
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  res.json({
    note: {
      id: slug,
      title: data.title || slug,
      content: content,
      description: data.description || '',
      slug: slug,
      updatedAt: data.updatedAt || fs.statSync(filePath).mtime.toISOString(),
    },
  });
});

// List all notes
app.get('/api/notes', async (req, res) => {
  const contentDir = path.join(process.cwd(), '../content');

  if (!fs.existsSync(contentDir)) {
    return res.json({ notes: [] });
  }

  const notes = [];
  const files = fs.readdirSync(contentDir);

  for (const file of files) {
    if (file.endsWith('.md')) {
      const filePath = path.join(contentDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data } = matter(fileContent);

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

  res.json({ notes });
});

// Search notes
app.get('/api/notes/search', async (req, res) => {
  const query = req.query.q || '';
  const contentDir = path.join(process.cwd(), '../content');

  if (!fs.existsSync(contentDir)) {
    return res.json({ results: [] });
  }

  const notes = [];
  const files = fs.readdirSync(contentDir);

  for (const file of files) {
    if (file.endsWith('.md')) {
      const filePath = path.join(contentDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content: fileContentText } = matter(fileContent);

      const slug = file.replace('.md', '');

      const titleLower = (data.title || slug).toLowerCase();
      const descriptionLower = (data.description || '').toLowerCase();
      const contentLower = fileContentText.toLowerCase();

      let relevance = 0;

      if (titleLower.includes(query.toLowerCase())) {
        relevance += 1;
      }
      if (descriptionLower.includes(query.toLowerCase())) {
        relevance += 0.5;
      }
      if (contentLower.includes(query.toLowerCase())) {
        relevance += 0.5;
      }

      if (relevance > 0) {
        notes.push({
          ...data,
          slug,
          relevance,
        });
      }
    }
  }

  const results = notes
    .filter((note) => note.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);

  res.json({ results });
});

app.listen(PORT, () => {
  console.log(`SSR Server running on http://localhost:${PORT}`);
});