#!/usr/bin/env node
/**
 * Security Now! Transcript Preprocessor
 * Extracts metadata, builds search index, calculates stats
 */

const fs = require('fs');
const path = require('path');

const TXT_DIR = './txt';
const OUTPUT_FILE = './sn-data.json';

// Leo-isms: Classic Leo Laporte phrases and sayings
const LEO_ISMS = [
  { phrase: "that's a great question", category: "engagement" },
  { phrase: "i love it", category: "enthusiasm" },
  { phrase: "fascinating", category: "enthusiasm" },
  { phrase: "that's hilarious", category: "humor" },
  { phrase: "oh my goodness", category: "surprise" },
  { phrase: "unbelievable", category: "surprise" },
  { phrase: "by the way", category: "transition" },
  { phrase: "speaking of which", category: "transition" },
  { phrase: "that reminds me", category: "transition" },
  { phrase: "no kidding", category: "agreement" },
  { phrase: "holy cow", category: "surprise" },
  { phrase: "incredible", category: "enthusiasm" },
  { phrase: "that's wild", category: "surprise" },
  { phrase: "you're right", category: "agreement" },
  { phrase: "exactly right", category: "agreement" },
  { phrase: "that's true", category: "agreement" },
  { phrase: "good point", category: "agreement" },
  { phrase: "fair enough", category: "concession" },
  { phrase: "wait a minute", category: "realization" },
  { phrase: "hold on", category: "interruption" },
  { phrase: "let me ask you", category: "inquiry" },
  { phrase: "tell me more", category: "inquiry" },
  { phrase: "explain that", category: "inquiry" },
  { phrase: "what do you mean", category: "clarification" },
  { phrase: "in other words", category: "clarification" },
  { phrase: "so basically", category: "summary" },
  { phrase: "bottom line", category: "summary" },
  { phrase: "the takeaway", category: "summary" },
  { phrase: "here's the thing", category: "emphasis" },
  { phrase: "my point is", category: "emphasis" },
  { phrase: "the thing is", category: "emphasis" },
  { phrase: "i gotta say", category: "opinion" },
  { phrase: "i gotta tell you", category: "opinion" },
  { phrase: "honestly", category: "candor" },
  { phrase: "frankly", category: "candor" },
  { phrase: "to be honest", category: "candor" },
  { phrase: "i'm curious", category: "inquiry" },
  { phrase: "that's scary", category: "concern" },
  { phrase: "that's terrifying", category: "concern" },
  { phrase: "that's crazy", category: "disbelief" },
  { phrase: "that's insane", category: "disbelief" },
  { phrase: "oh no", category: "dismay" },
  { phrase: "oh boy", category: "reaction" },
  { phrase: "oh man", category: "reaction" },
  { phrase: "oh wow", category: "reaction" },
  { phrase: "yikes", category: "concern" },
  { phrase: "geez", category: "reaction" },
  { phrase: "this is why", category: "explanation" },
  { phrase: "and that's why", category: "explanation" },
];

// Steve-isms: Classic Steve Gibson phrases and sayings
const STEVE_ISMS = [
  { phrase: "propeller head", category: "self-deprecation" },
  { phrase: "propeller-head", category: "self-deprecation" },
  { phrase: "the long way around", category: "explanation style" },
  { phrase: "what could possibly go wrong", category: "sarcasm" },
  { phrase: "security now", category: "show reference" },
  { phrase: "picture of the week", category: "show segment" },
  { phrase: "shortbread cookie", category: "favorites" },
  { phrase: "vitamin d", category: "health" },
  { phrase: "healthy paranoia", category: "security philosophy" },
  { phrase: "trust no one", category: "security philosophy" },
  { phrase: "the beauty of", category: "enthusiasm" },
  { phrase: "here's the thing", category: "explanation" },
  { phrase: "turns out", category: "revelation" },
  { phrase: "as we know", category: "callback" },
  { phrase: "the problem is", category: "analysis" },
  { phrase: "meanwhile", category: "transition" },
  { phrase: "fascinating", category: "enthusiasm" },
  { phrase: "believe it or not", category: "surprise" },
  { phrase: "lo and behold", category: "discovery" },
  { phrase: "ladies and gentlemen", category: "announcement" },
  { phrase: "coffee", category: "favorites" },
  { phrase: "yabba dabba doo", category: "humor" },
  { phrase: "whoopsie", category: "humor" },
  { phrase: "oops", category: "humor" },
  { phrase: "duh", category: "obvious" },
  { phrase: "exactly right", category: "agreement" },
  { phrase: "absolutely", category: "agreement" },
  { phrase: "perfect", category: "agreement" },
  { phrase: "brilliant", category: "praise" },
  { phrase: "clever", category: "praise" },
  { phrase: "elegant", category: "praise" },
  { phrase: "gnarly", category: "complexity" },
  { phrase: "funky", category: "oddity" },
  { phrase: "squirrely", category: "oddity" },
  { phrase: "kludge", category: "criticism" },
  { phrase: "hack", category: "technique" },
  { phrase: "deep dive", category: "explanation style" },
  { phrase: "in a nutshell", category: "summary" },
  { phrase: "bottom line", category: "summary" },
  { phrase: "long story short", category: "summary" },
  { phrase: "spoiler alert", category: "warning" },
  { phrase: "heads up", category: "warning" },
  { phrase: "full disclosure", category: "honesty" },
  { phrase: "for what it's worth", category: "opinion" },
  { phrase: "at the end of the day", category: "conclusion" },
  { phrase: "state of the art", category: "technology" },
  { phrase: "bleeding edge", category: "technology" },
  { phrase: "old school", category: "nostalgia" },
  { phrase: "back in the day", category: "nostalgia" },
];

// Security/tech terms to track over time
const TRACKED_TERMS = [
  'ransomware', 'malware', 'phishing', 'bitcoin', 'cryptocurrency',
  'iot', 'internet of things', 'zero-day', 'zero day', 'vpn',
  'password', 'two-factor', '2fa', 'encryption', 'tls', 'ssl',
  'firewall', 'router', 'dns', 'certificate', 'https',
  'microsoft', 'windows', 'apple', 'google', 'facebook', 'amazon',
  'linux', 'android', 'iphone', 'chrome', 'firefox',
  'ai', 'artificial intelligence', 'machine learning',
  'quantum', 'blockchain', 'cloud', 'spinrite',
  'sqrl', 'lastpass', '1password', 'bitwarden',
  'heartbleed', 'spectre', 'meltdown', 'log4j', 'solarwinds'
];

// Common words to exclude from word cloud
const STOP_WORDS = new Set([
  // Basic stop words
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'it', 'its', "it's", 'this', 'that', 'these', 'those', 'there',
  'here', 'where', 'when', 'what', 'which', 'who', 'whom', 'whose',
  'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us',
  'them', 'my', 'your', 'his', 'our', 'their', 'mine', 'yours',
  'not', "don't", "doesn't", "didn't", "won't", "wouldn't", "can't",
  'no', 'yes', 'so', 'if', 'then', 'else', 'just', 'only', 'also',
  'very', 'too', 'more', 'most', 'some', 'any', 'all', 'each',
  'every', 'both', 'few', 'many', 'much', 'other', 'another',
  'such', 'even', 'still', 'already', 'always', 'never', 'ever',
  'now', 'then', 'today', 'well', 'really', 'actually', 'basically',
  'about', 'like', 'know', 'think', 'want', 'going', 'get', 'got',
  'go', 'come', 'came', 'make', 'made', 'take', 'took', 'see', 'saw',
  'say', 'said', 'tell', 'told', 'ask', 'asked', 'use', 'used',
  'work', 'way', 'thing', 'things', 'something', 'anything', 'nothing',
  'everything', 'someone', 'anyone', 'everyone', 'time', 'year', 'years',
  'right', 'yeah', 'okay', 'oh', 'um', 'uh', 'mean', 'because', 'though',
  'through', 'being', 'let', "let's", 'look', 'back', 'first', 'into',
  'over', 'after', 'before', 'again', 'new', 'one', 'two', 'people',
  've', 're', 'll', 'd', 's', 't', 'm',

  // Speaker names and labels (podcast-specific)
  'steve', 'leo', 'gibson', 'laporte', 'steve', 'leop',

  // Contractions (appearing as fragments or full)
  "that's", "i'm", "they're", "there's", "you're", "we're", "we've",
  "i've", "it's", "he's", "she's", "what's", "here's", "who's",
  "doesn't", "isn't", "aren't", "wasn't", "weren't", "haven't",
  "hasn't", "hadn't", "don't", "didn't", "won't", "wouldn't",
  "couldn't", "shouldn't", "can't", "let's", "that'll", "you'll",
  "they'll", "we'll", "i'll", "he'll", "she'll", "it'll",
  "you've", "they've", "could've", "would've", "should've",
  "you'd", "they'd", "he'd", "she'd", "i'd", "we'd",

  // Common conversational/filler words
  'good', 'great', 'nice', 'cool', 'fine', 'bad', 'best', 'better',
  'little', 'big', 'long', 'short', 'old', 'young', 'high', 'low',
  'able', 'sort', 'kind', 'type', 'part', 'whole', 'half',
  'course', 'fact', 'case', 'point', 'example', 'instance',
  'says', 'saying', 'doing', 'getting', 'making', 'taking',
  'coming', 'looking', 'trying', 'talking', 'thinking', 'working',
  'same', 'different', 'similar', 'certain', 'sure', 'real',
  'anyway', 'actually', 'basically', 'really', 'probably', 'maybe',
  'exactly', 'definitely', 'certainly', 'simply', 'obviously',
  'lot', 'lots', 'bit', 'bunch', 'couple', 'few', 'several',
  'down', 'up', 'off', 'out', 'away', 'around', 'along',
  'last', 'next', 'end', 'beginning', 'start', 'stop',
  'week', 'day', 'month', 'moment', 'second', 'minute', 'hour',
  'show', 'episode', 'podcast', 'listeners', 'audience',
  'guy', 'guys', 'man', 'woman', 'person', 'somebody', 'everybody',
  'stuff', 'everything', 'nothing', 'something', 'anything',
  'place', 'world', 'life', 'home', 'house', 'room',
  'give', 'gave', 'given', 'put', 'keep', 'kept', 'leave', 'left',
  'find', 'found', 'feel', 'felt', 'believe', 'thought', 'guess',
  'understand', 'remember', 'talk', 'call', 'called', 'turn', 'run',
  'hand', 'head', 'side', 'word', 'words', 'number', 'numbers',
  'problem', 'problems', 'question', 'questions', 'answer', 'answers',
  'reason', 'reasons', 'idea', 'ideas', 'sense', 'means', 'name',
  'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'hundred', 'thousand', 'million', 'billion',
  'first', 'second', 'third', 'once', 'twice',
  'true', 'false', 'wrong', 'correct', 'real', 'actual',
  'whole', 'entire', 'full', 'empty', 'free', 'open', 'close',
  'need', 'needs', 'wanted', 'wants', 'using', 'used',
  'help', 'helps', 'helped', 'try', 'tries', 'tried',
  'happen', 'happens', 'happened', 'happening',
  'change', 'changes', 'changed', 'move', 'moves', 'moved',
  'read', 'write', 'writes', 'written', 'watch', 'hear', 'heard',
  'wait', 'send', 'sent', 'receive', 'received', 'pay', 'paid',
  'play', 'plays', 'playing', 'set', 'sets', 'setting',
  'show', 'shows', 'shown', 'showing', 'hold', 'holding',
  'bring', 'brought', 'buy', 'bought', 'sell', 'sold',
  'nice', 'interesting', 'important', 'possible', 'impossible',
  'easy', 'hard', 'difficult', 'simple', 'complex',
  'early', 'late', 'soon', 'later', 'ago', 'away',
  'enough', 'less', 'least', 'rather', 'quite', 'almost',
  'yet', 'already', 'whether', 'either', 'neither', 'else',
  'however', 'therefore', 'thus', 'hence', 'although', 'unless',
  'per', 'via', 'etc', 'vs', 'versus',

  // Additional conversational remnants
  'how', 'why', 'than', 'own', 'while', 'done', 'since', 'order',
  'under', 'without', 'having', 'wrote', 'essentially', 'wow',
  'talked', 'saying', 'tells', 'told', 'means', 'meant',
  'gets', 'makes', 'takes', 'goes', 'comes', 'looks', 'seems',
  'works', 'wants', 'needs', 'lets', 'puts', 'gives', 'keeps',
  'becomes', 'allows', 'requires', 'provides', 'includes', 'contains',
  'says', 'says', 'called', 'named', 'known', 'seen', 'heard',
  'every', 'within', 'without', 'between', 'among', 'above', 'below',
  'during', 'before', 'after', 'until', 'upon', 'across', 'along',
  'toward', 'towards', 'inside', 'outside', 'behind', 'beyond',
  'news', 'mentioned', 'talking', 'saying', 'discuss', 'discussed',
  'actually', 'apparently', 'especially', 'generally', 'usually',
  'typically', 'particularly', 'specifically', 'necessarily',
  'completely', 'entirely', 'absolutely', 'totally', 'fully',
  'clearly', 'simply', 'easily', 'quickly', 'slowly', 'carefully',
  'different', 'various', 'several', 'multiple', 'single', 'double',
  'main', 'major', 'minor', 'primary', 'secondary', 'additional',
  'original', 'current', 'previous', 'following', 'recent', 'latest',
  'common', 'standard', 'normal', 'typical', 'usual', 'regular',
  'special', 'specific', 'particular', 'certain', 'given',
  'available', 'able', 'capable', 'possible', 'likely', 'unlikely'
]);

function parseEpisode(filename) {
  const filepath = path.join(TXT_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');

  // Extract metadata from headers
  const episode = {
    file: filename,
    number: parseInt(filename.match(/sn-(\d+)/)?.[1] || '0'),
    title: '',
    date: '',
    year: 0,
    description: '',
    wordCount: 0,
    speakers: {},
    termCounts: {}
  };

  let inHeader = true;
  let bodyStart = 0;

  for (let i = 0; i < lines.length && i < 50; i++) {
    const line = lines[i];

    if (line.startsWith('EPISODE:')) {
      const match = line.match(/#?(\d+)/);
      if (match) episode.number = parseInt(match[1]);
    } else if (line.startsWith('TITLE:')) {
      episode.title = line.replace('TITLE:', '').trim();
    } else if (line.startsWith('DATE:')) {
      episode.date = line.replace('DATE:', '').trim();
      const yearMatch = episode.date.match(/\d{4}/);
      if (yearMatch) episode.year = parseInt(yearMatch[0]);
    } else if (line.startsWith('DESCRIPTION:')) {
      episode.description = line.replace('DESCRIPTION:', '').trim();
    }

    // Detect body start (speaker name followed by colon)
    if (inHeader && /^[A-Z][A-Z\s]+:/.test(line) && !line.startsWith('SERIES:') &&
        !line.startsWith('EPISODE:') && !line.startsWith('DATE:') &&
        !line.startsWith('TITLE:') && !line.startsWith('HOSTS:') &&
        !line.startsWith('SPEAKERS:') && !line.startsWith('SOURCE') &&
        !line.startsWith('ARCHIVE:') && !line.startsWith('DESCRIPTION:') &&
        !line.startsWith('FILE ') && !line.startsWith('SHOW TEASE:')) {
      inHeader = false;
      bodyStart = i;
    }
  }

  // Process body content
  const bodyLines = lines.slice(bodyStart);
  const bodyText = bodyLines.join(' ');
  const words = bodyText.toLowerCase().match(/\b[a-z][a-z'-]*[a-z]\b|\b[a-z]\b/g) || [];
  episode.wordCount = words.length;

  // Count speaker lines
  const speakerPattern = /^([A-Z][A-Z\s]+):/;
  for (const line of bodyLines) {
    const match = line.match(speakerPattern);
    if (match) {
      const speaker = match[1].trim();
      episode.speakers[speaker] = (episode.speakers[speaker] || 0) + 1;
    }
  }

  // Count tracked terms
  const lowerBody = bodyText.toLowerCase();
  for (const term of TRACKED_TERMS) {
    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = lowerBody.match(regex);
    if (matches && matches.length > 0) {
      episode.termCounts[term] = matches.length;
    }
  }

  // Get content for search (title + description + first 500 words of body)
  episode.searchText = `${episode.title} ${episode.description} ${words.slice(0, 500).join(' ')}`;

  return { episode, words };
}

function buildWordFrequencies(allWords) {
  const freq = {};
  for (const word of allWords) {
    if (word.length > 2 && !STOP_WORDS.has(word) && !/^\d+$/.test(word)) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }

  // Sort and take top 500
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 500)
    .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {});
}

function extractPhrases(files, phraseList, label) {
  console.log(`Extracting ${label}...`);
  const results = {};

  // Initialize results for each phrase
  for (const { phrase, category } of phraseList) {
    results[phrase] = {
      category,
      count: 0,
      quotes: []
    };
  }

  for (const file of files) {
    const filepath = path.join(TXT_DIR, file);
    const content = fs.readFileSync(filepath, 'utf-8');
    const epNum = parseInt(file.match(/sn-(\d+)/)?.[1] || '0');

    // Get episode title from content
    const titleMatch = content.match(/TITLE:\s*(.+)/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    for (const { phrase } of phraseList) {
      const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      let match;

      while ((match = regex.exec(content)) !== null) {
        results[phrase].count++;

        // Only store up to 20 quotes per phrase (random sampling for common ones)
        if (results[phrase].quotes.length < 20 || Math.random() < 0.1) {
          // Extract context: ~100 chars before and after
          const start = Math.max(0, match.index - 100);
          const end = Math.min(content.length, match.index + phrase.length + 100);
          let context = content.slice(start, end);

          // Clean up the context
          context = context
            .replace(/\s+/g, ' ')  // normalize whitespace
            .replace(/^[^a-zA-Z]*/, '')  // trim non-letter start
            .replace(/[^a-zA-Z.!?]*$/, '');  // trim non-letter end

          // Add ellipsis if truncated
          if (start > 0) context = '...' + context;
          if (end < content.length) context = context + '...';

          // Highlight the phrase
          const highlightRegex = new RegExp(`(${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          context = context.replace(highlightRegex, '**$1**');

          if (results[phrase].quotes.length < 20) {
            results[phrase].quotes.push({
              ep: epNum,
              title: title,
              text: context
            });
          } else {
            // Randomly replace an existing quote to get variety
            const idx = Math.floor(Math.random() * 20);
            results[phrase].quotes[idx] = {
              ep: epNum,
              title: title,
              text: context
            };
          }
        }
      }
    }
  }

  // Sort quotes by episode number for each phrase
  for (const phrase of Object.keys(results)) {
    results[phrase].quotes.sort((a, b) => a.ep - b.ep);
  }

  // Log some stats
  const totalQuotes = Object.values(results).reduce((sum, r) => sum + r.count, 0);
  const topPhrases = Object.entries(results)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([p, r]) => `${p} (${r.count})`)
    .join(', ');

  console.log(`  Found ${totalQuotes.toLocaleString()} total ${label} occurrences`);
  console.log(`  Top phrases: ${topPhrases}`);

  return results;
}

function buildYearlyTermTrends(episodes) {
  const trends = {};

  for (const ep of episodes) {
    if (!ep.year) continue;
    if (!trends[ep.year]) {
      trends[ep.year] = { episodeCount: 0, terms: {} };
    }
    trends[ep.year].episodeCount++;

    for (const [term, count] of Object.entries(ep.termCounts)) {
      trends[ep.year].terms[term] = (trends[ep.year].terms[term] || 0) + count;
    }
  }

  return trends;
}

function main() {
  console.log('🔐 Security Now! Preprocessor');
  console.log('============================\n');

  const files = fs.readdirSync(TXT_DIR)
    .filter(f => f.match(/^sn-\d+\.txt$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });

  console.log(`Found ${files.length} episode files\n`);

  const episodes = [];
  let allWords = [];
  let processed = 0;

  for (const file of files) {
    try {
      const { episode, words } = parseEpisode(file);
      episodes.push(episode);
      allWords = allWords.concat(words);
      processed++;

      if (processed % 100 === 0) {
        console.log(`  Processed ${processed}/${files.length}...`);
      }
    } catch (err) {
      console.error(`  Error processing ${file}: ${err.message}`);
    }
  }

  console.log(`\nProcessed ${processed} episodes`);
  console.log(`Total words: ${allWords.length.toLocaleString()}`);

  // Build aggregated data
  console.log('\nBuilding word frequencies...');
  const wordFrequencies = buildWordFrequencies(allWords);

  console.log('Building yearly trends...');
  const yearlyTrends = buildYearlyTermTrends(episodes);

  // Extract -isms
  const steveIsms = extractPhrases(files, STEVE_ISMS, 'Steve-isms');
  const leoIsms = extractPhrases(files, LEO_ISMS, 'Leo-isms');

  // Calculate stats
  const stats = {
    totalEpisodes: episodes.length,
    totalWords: allWords.length,
    dateRange: {
      first: episodes[0]?.date || 'Unknown',
      last: episodes[episodes.length - 1]?.date || 'Unknown'
    },
    avgWordsPerEpisode: Math.round(allWords.length / episodes.length),
    trackedTerms: TRACKED_TERMS
  };

  // Build output
  const output = {
    generated: new Date().toISOString(),
    stats,
    episodes: episodes.map(e => ({
      n: e.number,
      t: e.title,
      d: e.date,
      y: e.year,
      desc: e.description,
      wc: e.wordCount,
      sp: e.speakers,
      tc: e.termCounts,
      st: e.searchText
    })),
    wordFrequencies,
    yearlyTrends,
    steveIsms,
    leoIsms
  };

  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output));
  const fileSizeMB = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2);

  console.log(`\n✅ Output written to ${OUTPUT_FILE} (${fileSizeMB} MB)`);
  console.log('\nStats:');
  console.log(`  Episodes: ${stats.totalEpisodes}`);
  console.log(`  Total words: ${stats.totalWords.toLocaleString()}`);
  console.log(`  Avg words/episode: ${stats.avgWordsPerEpisode.toLocaleString()}`);
  console.log(`  Date range: ${stats.dateRange.first} - ${stats.dateRange.last}`);
  console.log(`  Top words: ${Object.keys(wordFrequencies).slice(0, 10).join(', ')}`);
}

main();
