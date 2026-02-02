#!/usr/bin/env node
/**
 * Codex Preprocessor
 * Builds search index from source text files.
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIRS = [
  { dir: 'txt/folger', category: 'shakespeare', icon: '🎭' },
  { dir: 'txt/lds-quad', category: 'scripture', icon: '📖' }
];

const OUTPUT_FILE = path.join(__dirname, 'codex-data.json');

// Nice display names for files
const DISPLAY_NAMES = {
  // Shakespeare (auto-generated from filename)
  // LDS Quad
  'bom.txt': 'Book of Mormon',
  'kjv.txt': 'Bible (KJV)',
  'dnc.txt': 'Doctrine & Covenants',
  'pogp.txt': 'Pearl of Great Price'
};

function getDisplayName(filename) {
  if (DISPLAY_NAMES[filename]) return DISPLAY_NAMES[filename];

  // Convert filename like "hamlet_TXT_FolgerShakespeare.txt" to "Hamlet"
  return filename
    .replace(/_TXT_FolgerShakespeare\.txt$/, '')
    .replace(/\.txt$/, '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getShortName(filename) {
  // Short identifier for the file
  return filename
    .replace(/_TXT_FolgerShakespeare\.txt$/, '')
    .replace(/\.txt$/, '')
    .toLowerCase()
    .replace(/-/g, '_');
}

function chunkText(text, targetSize = 800) {
  // Split text into chunks, breaking at line boundaries
  const chunks = [];
  const lines = text.split('\n').filter(l => l.trim().length > 0);

  let currentChunk = '';
  let chunkIndex = 0;

  for (const line of lines) {
    // If adding this line would exceed target and we have content, flush
    if (currentChunk.length + line.length > targetSize && currentChunk.length > 100) {
      chunks.push({
        index: chunkIndex++,
        text: currentChunk.trim(),
        searchText: currentChunk.trim().toLowerCase()
      });
      currentChunk = '';
    }
    currentChunk += line + '\n';
  }

  // Flush remaining
  if (currentChunk.trim()) {
    chunks.push({
      index: chunkIndex,
      text: currentChunk.trim(),
      searchText: currentChunk.trim().toLowerCase()
    });
  }

  return chunks;
}

function processFile(filepath, category, icon) {
  const filename = path.basename(filepath);
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split('\n');

  // Get word count
  const words = content.split(/\s+/).filter(w => w.length > 0);

  // Chunk the text for search
  const chunks = chunkText(content);

  return {
    id: getShortName(filename),
    filename: filename,
    title: getDisplayName(filename),
    category: category,
    icon: icon,
    wordCount: words.length,
    lineCount: lines.length,
    chunkCount: chunks.length,
    chunks: chunks
  };
}

function main() {
  console.log('Codex Preprocessor');
  console.log('==================\n');

  const works = [];
  const allChunks = [];
  let chunkIdCounter = 0;

  for (const source of SOURCE_DIRS) {
    const dirPath = path.join(__dirname, source.dir);

    if (!fs.existsSync(dirPath)) {
      console.log(`Skipping ${source.dir} (not found)`);
      continue;
    }

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.txt'));
    console.log(`Processing ${source.dir}: ${files.length} files`);

    for (const file of files) {
      const filepath = path.join(dirPath, file);
      const work = processFile(filepath, source.category, source.icon);

      // Add global chunk IDs and work reference
      for (const chunk of work.chunks) {
        chunk.id = chunkIdCounter++;
        chunk.workId = work.id;
        allChunks.push(chunk);
      }

      // Store work metadata (without chunks to save space in works array)
      works.push({
        id: work.id,
        filename: work.filename,
        title: work.title,
        category: work.category,
        icon: work.icon,
        wordCount: work.wordCount,
        lineCount: work.lineCount,
        chunkCount: work.chunkCount
      });

      console.log(`  - ${work.title}: ${work.wordCount.toLocaleString()} words, ${work.chunkCount} chunks`);
    }
  }

  // Calculate totals
  const totalWords = works.reduce((sum, w) => sum + w.wordCount, 0);
  const totalChunks = allChunks.length;

  // Build output
  const output = {
    works: works,
    chunks: allChunks,
    stats: {
      workCount: works.length,
      chunkCount: totalChunks,
      wordCount: totalWords
    },
    categories: [...new Set(works.map(w => w.category))],
    generated: new Date().toISOString()
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output));

  console.log(`\nTotal: ${works.length} works, ${totalWords.toLocaleString()} words, ${totalChunks.toLocaleString()} chunks`);
  console.log(`Wrote: ${OUTPUT_FILE}`);
  console.log(`Size: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);
}

main();
