#!/usr/bin/env node
/**
 * Ministry of Grep - Corpus Preprocessor
 *
 * Scans corpus directories, validates texts, builds search indexes.
 * Run: node txt/engine/preprocess.js
 *
 * For each corpus directory with a corpus.config.json:
 * 1. Reads all .txt/.md files
 * 2. Chunks them according to config rules
 * 3. Generates corpus-index.json (searchable chunks)
 * 4. Updates global manifest.json
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT_DIR, 'manifest.json');

// Default chunking: split on double newlines (paragraphs)
const DEFAULT_CHUNK_PATTERN = /\n\n+/;

/**
 * Scan for corpus directories (those with corpus.config.json)
 */
function findCorpora() {
  const corpora = [];
  const entries = fs.readdirSync(ROOT_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'engine') continue;

    const configPath = path.join(ROOT_DIR, entry.name, 'corpus.config.json');
    if (fs.existsSync(configPath)) {
      corpora.push({
        id: entry.name,
        path: path.join(ROOT_DIR, entry.name),
        configPath
      });
    }
  }

  return corpora;
}

/**
 * Load and validate corpus config
 */
function loadConfig(configPath) {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(raw);

    // Required fields
    if (!config.title) throw new Error('Missing title');

    // Defaults
    return {
      title: config.title,
      subtitle: config.subtitle || '',
      author: config.author || 'Unknown',
      description: config.description || '',
      textsDir: config.textsDir || 'texts',
      chunkBy: config.chunkBy || 'paragraph', // paragraph, line, section, verse
      chunkPattern: config.chunkPattern || null,
      filePattern: config.filePattern || '**/*.txt',
      theme: config.theme || 'default',
      categories: config.categories || [],
      ...config
    };
  } catch (err) {
    console.error(`Error loading config ${configPath}:`, err.message);
    return null;
  }
}

/**
 * Find all text files in a corpus
 */
function findTextFiles(corpusPath, textsDir) {
  const textsPath = path.join(corpusPath, textsDir);
  if (!fs.existsSync(textsPath)) {
    console.warn(`  Texts directory not found: ${textsPath}`);
    return [];
  }

  const files = [];

  function walkDir(dir, prefix = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        walkDir(fullPath, relPath);
      } else if (entry.name.endsWith('.txt') || entry.name.endsWith('.md')) {
        files.push({ fullPath, relPath, name: entry.name });
      }
    }
  }

  walkDir(textsPath);
  return files.sort((a, b) => a.relPath.localeCompare(b.relPath));
}

/**
 * Parse metadata header from text file (optional YAML-like front matter)
 * Format:
 * ---
 * title: Hamlet
 * author: Shakespeare
 * category: Tragedy
 * ---
 */
function parseMetadata(content) {
  const metadata = {};
  let body = content;

  if (content.startsWith('---')) {
    const endMatch = content.indexOf('\n---', 3);
    if (endMatch !== -1) {
      const header = content.slice(4, endMatch);
      body = content.slice(endMatch + 5).trim();

      // Parse simple key: value pairs
      for (const line of header.split('\n')) {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) {
          metadata[match[1].toLowerCase()] = match[2].trim();
        }
      }
    }
  }

  return { metadata, body };
}

/**
 * Chunk text into searchable units
 */
function chunkText(body, config, fileInfo) {
  const chunks = [];
  let pattern;

  // Determine chunking pattern
  switch (config.chunkBy) {
    case 'line':
      pattern = /\n/;
      break;
    case 'section':
      // Split on headers (# Header or === underlines)
      pattern = /\n(?=#{1,3}\s|\n===+\n|\n---+\n)/;
      break;
    case 'verse':
      // Each line is a verse (for poetry/scripture)
      pattern = /\n/;
      break;
    case 'paragraph':
    default:
      pattern = /\n\n+/;
  }

  // Allow custom pattern override
  if (config.chunkPattern) {
    pattern = new RegExp(config.chunkPattern);
  }

  const parts = body.split(pattern).filter(p => p.trim());

  for (let i = 0; i < parts.length; i++) {
    const text = parts[i].trim();
    if (!text) continue;

    // Generate stable ID
    const chunkId = `${fileInfo.relPath.replace(/\.[^.]+$/, '')}-${i + 1}`;

    chunks.push({
      id: chunkId,
      file: fileInfo.relPath,
      index: i + 1,
      text: text,
      // Lowercase version for search (separate to preserve display)
      searchText: text.toLowerCase()
    });
  }

  return chunks;
}

/**
 * Process a single corpus
 */
function processCorpus(corpus) {
  console.log(`\nProcessing: ${corpus.id}`);

  const config = loadConfig(corpus.configPath);
  if (!config) return null;

  console.log(`  Title: ${config.title}`);

  const textFiles = findTextFiles(corpus.path, config.textsDir);
  console.log(`  Found ${textFiles.length} text file(s)`);

  const allChunks = [];
  const works = [];
  let totalWords = 0;

  for (const file of textFiles) {
    const content = fs.readFileSync(file.fullPath, 'utf8');
    const { metadata, body } = parseMetadata(content);

    const chunks = chunkText(body, config, file);

    // Count words
    const wordCount = body.split(/\s+/).filter(w => w).length;
    totalWords += wordCount;

    // Track this work
    works.push({
      file: file.relPath,
      title: metadata.title || file.name.replace(/\.[^.]+$/, ''),
      author: metadata.author || config.author,
      category: metadata.category || '',
      chunkCount: chunks.length,
      wordCount
    });

    allChunks.push(...chunks);
  }

  console.log(`  Chunks: ${allChunks.length}`);
  console.log(`  Words: ${totalWords.toLocaleString()}`);

  // Write corpus index
  const indexPath = path.join(corpus.path, 'corpus-index.json');
  const indexData = {
    id: corpus.id,
    title: config.title,
    subtitle: config.subtitle,
    author: config.author,
    description: config.description,
    theme: config.theme,
    works,
    chunks: allChunks,
    stats: {
      works: works.length,
      chunks: allChunks.length,
      words: totalWords
    },
    generated: new Date().toISOString()
  };

  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
  console.log(`  Wrote: ${indexPath}`);

  return {
    id: corpus.id,
    title: config.title,
    subtitle: config.subtitle,
    author: config.author,
    description: config.description,
    theme: config.theme,
    works: works.length,
    chunks: allChunks.length,
    words: totalWords
  };
}

/**
 * Main entry
 */
function main() {
  console.log('Ministry of Grep - Corpus Preprocessor');
  console.log('======================================');

  const corpora = findCorpora();
  console.log(`Found ${corpora.length} corpus/corpora`);

  const manifest = {
    corpora: [],
    generated: new Date().toISOString()
  };

  for (const corpus of corpora) {
    const result = processCorpus(corpus);
    if (result) {
      manifest.corpora.push(result);
    }
  }

  // Write global manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\nWrote manifest: ${MANIFEST_PATH}`);

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Corpora: ${manifest.corpora.length}`);
  console.log(`Total works: ${manifest.corpora.reduce((s, c) => s + c.works, 0)}`);
  console.log(`Total chunks: ${manifest.corpora.reduce((s, c) => s + c.chunks, 0)}`);
  console.log(`Total words: ${manifest.corpora.reduce((s, c) => s + c.words, 0).toLocaleString()}`);
}

main();
