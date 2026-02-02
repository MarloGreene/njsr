#!/usr/bin/env node
/**
 * Shakespeare Preprocessor
 * Parses t8.shakespeare.txt into structured JSON for the explorer.
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 't8.shakespeare.txt');
const OUTPUT_FILE = path.join(__dirname, 'shakespeare-data.json');

// All 38 works in t8.shakespeare.txt (exact titles as they appear in the file)
const WORK_TITLES = new Set([
  'THE SONNETS',
  'ALLS WELL THAT ENDS WELL',
  'THE TRAGEDY OF ANTONY AND CLEOPATRA',
  'AS YOU LIKE IT',
  'THE COMEDY OF ERRORS',
  'THE TRAGEDY OF CORIOLANUS',
  'CYMBELINE',
  'THE TRAGEDY OF HAMLET, PRINCE OF DENMARK',
  'THE FIRST PART OF KING HENRY THE FOURTH',
  'SECOND PART OF KING HENRY IV',
  'THE LIFE OF KING HENRY THE FIFTH',
  'THE FIRST PART OF HENRY THE SIXTH',
  'THE SECOND PART OF KING HENRY THE SIXTH',
  'THE THIRD PART OF KING HENRY THE SIXTH',
  'KING HENRY THE EIGHTH',
  'KING JOHN',
  'THE TRAGEDY OF JULIUS CAESAR',
  'THE TRAGEDY OF KING LEAR',
  "LOVE'S LABOUR'S LOST",
  'THE TRAGEDY OF MACBETH',
  'MEASURE FOR MEASURE',
  'THE MERCHANT OF VENICE',
  'THE MERRY WIVES OF WINDSOR',
  "A MIDSUMMER NIGHT'S DREAM",
  'MUCH ADO ABOUT NOTHING',
  'THE TRAGEDY OF OTHELLO, MOOR OF VENICE',
  'KING RICHARD THE SECOND',
  'KING RICHARD III',
  'THE TRAGEDY OF ROMEO AND JULIET',
  'THE TAMING OF THE SHREW',
  'THE TEMPEST',
  'THE LIFE OF TIMON OF ATHENS',
  'THE TRAGEDY OF TITUS ANDRONICUS',
  'THE HISTORY OF TROILUS AND CRESSIDA',
  'TWELFTH NIGHT; OR, WHAT YOU WILL',
  'THE TWO GENTLEMEN OF VERONA',
  "THE WINTER'S TALE",
  "A LOVER'S COMPLAINT"
]);

// Create display-friendly title from full title
function getDisplayTitle(fullTitle) {
  // Map of full titles to nicer display names
  const displayMap = {
    'THE SONNETS': 'The Sonnets',
    'ALLS WELL THAT ENDS WELL': "All's Well That Ends Well",
    'THE TRAGEDY OF ANTONY AND CLEOPATRA': 'Antony and Cleopatra',
    'AS YOU LIKE IT': 'As You Like It',
    'THE COMEDY OF ERRORS': 'The Comedy of Errors',
    'THE TRAGEDY OF CORIOLANUS': 'Coriolanus',
    'CYMBELINE': 'Cymbeline',
    'THE TRAGEDY OF HAMLET, PRINCE OF DENMARK': 'Hamlet',
    'THE FIRST PART OF KING HENRY THE FOURTH': 'Henry IV, Part 1',
    'SECOND PART OF KING HENRY IV': 'Henry IV, Part 2',
    'THE LIFE OF KING HENRY THE FIFTH': 'Henry V',
    'THE FIRST PART OF HENRY THE SIXTH': 'Henry VI, Part 1',
    'THE SECOND PART OF KING HENRY THE SIXTH': 'Henry VI, Part 2',
    'THE THIRD PART OF KING HENRY THE SIXTH': 'Henry VI, Part 3',
    'KING HENRY THE EIGHTH': 'Henry VIII',
    'KING JOHN': 'King John',
    'THE TRAGEDY OF JULIUS CAESAR': 'Julius Caesar',
    'THE TRAGEDY OF KING LEAR': 'King Lear',
    "LOVE'S LABOUR'S LOST": "Love's Labour's Lost",
    'THE TRAGEDY OF MACBETH': 'Macbeth',
    'MEASURE FOR MEASURE': 'Measure for Measure',
    'THE MERCHANT OF VENICE': 'The Merchant of Venice',
    'THE MERRY WIVES OF WINDSOR': 'The Merry Wives of Windsor',
    "A MIDSUMMER NIGHT'S DREAM": "A Midsummer Night's Dream",
    'MUCH ADO ABOUT NOTHING': 'Much Ado About Nothing',
    'THE TRAGEDY OF OTHELLO, MOOR OF VENICE': 'Othello',
    'KING RICHARD THE SECOND': 'Richard II',
    'KING RICHARD III': 'Richard III',
    'THE TRAGEDY OF ROMEO AND JULIET': 'Romeo and Juliet',
    'THE TAMING OF THE SHREW': 'The Taming of the Shrew',
    'THE TEMPEST': 'The Tempest',
    'THE LIFE OF TIMON OF ATHENS': 'Timon of Athens',
    'THE TRAGEDY OF TITUS ANDRONICUS': 'Titus Andronicus',
    'THE HISTORY OF TROILUS AND CRESSIDA': 'Troilus and Cressida',
    'TWELFTH NIGHT; OR, WHAT YOU WILL': 'Twelfth Night',
    'THE TWO GENTLEMEN OF VERONA': 'The Two Gentlemen of Verona',
    "THE WINTER'S TALE": "The Winter's Tale",
    "A LOVER'S COMPLAINT": "A Lover's Complaint"
  };
  return displayMap[fullTitle] || fullTitle;
}

// Famous quotes for the random quote feature
const FAMOUS_QUOTES = [
  { text: "To be, or not to be, that is the question", work: "Hamlet", act: 3, scene: 1 },
  { text: "All the world's a stage, and all the men and women merely players", work: "As You Like It", act: 2, scene: 7 },
  { text: "Romeo, Romeo, wherefore art thou Romeo?", work: "Romeo and Juliet", act: 2, scene: 2 },
  { text: "Now is the winter of our discontent made glorious summer by this sun of York", work: "Richard III", act: 1, scene: 1 },
  { text: "Out, damned spot! out, I say!", work: "Macbeth", act: 5, scene: 1 },
  { text: "The lady doth protest too much, methinks", work: "Hamlet", act: 3, scene: 2 },
  { text: "What's in a name? That which we call a rose by any other name would smell as sweet", work: "Romeo and Juliet", act: 2, scene: 2 },
  { text: "If music be the food of love, play on", work: "Twelfth Night", act: 1, scene: 1 },
  { text: "Double, double toil and trouble; Fire burn, and cauldron bubble", work: "Macbeth", act: 4, scene: 1 },
  { text: "Friends, Romans, countrymen, lend me your ears", work: "Julius Caesar", act: 3, scene: 2 },
  { text: "Beware the Ides of March", work: "Julius Caesar", act: 1, scene: 2 },
  { text: "The fault, dear Brutus, is not in our stars, but in ourselves", work: "Julius Caesar", act: 1, scene: 2 },
  { text: "Et tu, Brute?", work: "Julius Caesar", act: 3, scene: 1 },
  { text: "Parting is such sweet sorrow", work: "Romeo and Juliet", act: 2, scene: 2 },
  { text: "This above all: to thine own self be true", work: "Hamlet", act: 1, scene: 3 },
  { text: "Something is rotten in the state of Denmark", work: "Hamlet", act: 1, scene: 4 },
  { text: "Though she be but little, she is fierce", work: "A Midsummer Night's Dream", act: 3, scene: 2 },
  { text: "We are such stuff as dreams are made on", work: "The Tempest", act: 4, scene: 1 },
  { text: "O, what a tangled web we weave", work: "Othello", act: 2, scene: 3 },
  { text: "The course of true love never did run smooth", work: "A Midsummer Night's Dream", act: 1, scene: 1 },
  { text: "Love all, trust a few, do wrong to none", work: "All's Well That Ends Well", act: 1, scene: 1 },
  { text: "Hell is empty and all the devils are here", work: "The Tempest", act: 1, scene: 2 },
  { text: "By the pricking of my thumbs, something wicked this way comes", work: "Macbeth", act: 4, scene: 1 },
  { text: "All that glitters is not gold", work: "The Merchant of Venice", act: 2, scene: 7 },
  { text: "Cowards die many times before their deaths; the valiant never taste of death but once", work: "Julius Caesar", act: 2, scene: 2 },
  { text: "How sharper than a serpent's tooth it is to have a thankless child", work: "King Lear", act: 1, scene: 4 },
  { text: "Lord, what fools these mortals be!", work: "A Midsummer Night's Dream", act: 3, scene: 2 },
  { text: "Brevity is the soul of wit", work: "Hamlet", act: 2, scene: 2 },
  { text: "There is nothing either good or bad, but thinking makes it so", work: "Hamlet", act: 2, scene: 2 },
  { text: "Off with his head!", work: "Richard III", act: 3, scene: 4 },
  { text: "A horse! A horse! My kingdom for a horse!", work: "Richard III", act: 5, scene: 4 },
  { text: "Some are born great, some achieve greatness, and some have greatness thrust upon them", work: "Twelfth Night", act: 2, scene: 5 },
  { text: "The better part of valor is discretion", work: "Henry IV Part 1", act: 5, scene: 4 },
  { text: "Once more unto the breach, dear friends, once more", work: "Henry V", act: 3, scene: 1 },
  { text: "Cry 'Havoc!' and let slip the dogs of war", work: "Julius Caesar", act: 3, scene: 1 },
  { text: "Good night, good night! Parting is such sweet sorrow", work: "Romeo and Juliet", act: 2, scene: 2 },
  { text: "What a piece of work is man", work: "Hamlet", act: 2, scene: 2 },
  { text: "Uneasy lies the head that wears a crown", work: "Henry IV Part 2", act: 3, scene: 1 },
  { text: "The first thing we do, let's kill all the lawyers", work: "Henry VI Part 2", act: 4, scene: 2 },
  { text: "O, brave new world, that has such people in't!", work: "The Tempest", act: 5, scene: 1 }
];

// Shakespearean insult components
const INSULT_COL1 = [
  "artless", "bawdy", "beslubbering", "bootless", "churlish", "cockered", "clouted",
  "craven", "currish", "dankish", "dissembling", "droning", "errant", "fawning",
  "fobbing", "froward", "frothy", "gleeking", "goatish", "gorbellied", "impertinent",
  "infectious", "jarring", "loggerheaded", "lumpish", "mammering", "mangled", "mewling",
  "paunchy", "pribbling", "puking", "puny", "qualling", "rank", "reeky", "roguish",
  "ruttish", "saucy", "spleeny", "spongy", "surly", "tottering", "unmuzzled", "vain",
  "venomed", "villainous", "warped", "wayward", "weedy", "yeasty"
];

const INSULT_COL2 = [
  "base-court", "bat-fowling", "beef-witted", "beetle-headed", "boil-brained",
  "clapper-clawed", "clay-brained", "common-kissing", "crook-pated", "dismal-dreaming",
  "dizzy-eyed", "doghearted", "dread-bolted", "earth-vexing", "elf-skinned",
  "fat-kidneyed", "fen-sucked", "flap-mouthed", "fly-bitten", "folly-fallen",
  "fool-born", "full-gorged", "guts-griping", "half-faced", "hasty-witted",
  "hedge-born", "hell-hated", "idle-headed", "ill-breeding", "ill-nurtured",
  "knotty-pated", "milk-livered", "motley-minded", "onion-eyed", "plume-plucked",
  "pottle-deep", "pox-marked", "reeling-ripe", "rough-hewn", "rude-growing",
  "rump-fed", "shard-borne", "sheep-biting", "spur-galled", "swag-bellied",
  "tardy-gaited", "tickle-brained", "toad-spotted", "unchin-snouted", "weather-bitten"
];

const INSULT_COL3 = [
  "apple-john", "baggage", "barnacle", "bladder", "boar-pig", "bugbear", "bum-bailey",
  "canker-blossom", "clack-dish", "clotpole", "coxcomb", "codpiece", "death-token",
  "dewberry", "flap-dragon", "flax-wench", "flirt-gill", "foot-licker", "fustilarian",
  "giglet", "gudgeon", "haggard", "harpy", "hedge-pig", "horn-beast", "hugger-mugger",
  "joithead", "lewdster", "lout", "maggot-pie", "malt-worm", "mammet", "measle",
  "minnow", "miscreant", "moldwarp", "mumblecrust", "nut-hook", "pigeon-egg",
  "pignut", "puttock", "pumpion", "ratsbane", "scut", "skainsmate", "strumpet",
  "varlot", "vassal", "whey-face", "wagtail"
];

// Character name components for generator
const NAME_PREFIXES = [
  "Lord", "Lady", "Sir", "Duke", "Prince", "Princess", "King", "Queen",
  "Count", "Countess", "Baron", "Earl"
];

const NAME_FIRST = [
  "Oberon", "Titania", "Puck", "Ariel", "Prospero", "Miranda", "Viola", "Olivia",
  "Sebastian", "Orsino", "Malvolio", "Feste", "Rosalind", "Orlando", "Celia",
  "Touchstone", "Beatrice", "Benedick", "Claudio", "Hero", "Portia", "Bassanio",
  "Shylock", "Antonio", "Lorenzo", "Jessica", "Hamlet", "Ophelia", "Horatio",
  "Polonius", "Laertes", "Gertrude", "Claudius", "Othello", "Desdemona", "Iago",
  "Cassio", "Emilia", "Macbeth", "Banquo", "Duncan", "Malcolm", "Macduff"
];

const NAME_PLACES = [
  "of Arden", "of Illyria", "of Verona", "of Venice", "of Denmark", "of Scotland",
  "of Athens", "of Rome", "of Egypt", "of Messina", "of Padua", "of Milan",
  "of Navarre", "of Bohemia", "of Sicily", "of Windsor", "of Ephesus"
];

function main() {
  console.log('Shakespeare Preprocessor');
  console.log('========================\n');

  const raw = fs.readFileSync(INPUT_FILE, 'utf8');
  const lines = raw.split('\n');

  console.log(`Total lines: ${lines.length.toLocaleString()}`);

  // Find where the actual content starts (after the Gutenberg header)
  let contentStart = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '1609' && lines[i + 2]?.includes('THE SONNETS')) {
      contentStart = i;
      break;
    }
  }

  console.log(`Content starts at line: ${contentStart}`);

  // Parse works
  const works = [];
  const searchChunks = [];
  let currentWork = null;
  let currentAct = null;
  let currentScene = null;
  let lineBuffer = [];
  let chunkId = 0;

  // Work type detection
  const TRAGEDIES = ['hamlet', 'macbeth', 'othello', 'lear', 'romeo', 'julius caesar', 'antony', 'coriolanus', 'titus'];
  const COMEDIES = ['dream', 'twelfth', 'much ado', 'as you like', 'merry wives', 'comedy of errors', 'taming', 'tempest', 'merchant'];
  const HISTORIES = ['henry', 'richard', 'king john'];

  function getWorkType(title) {
    const lower = title.toLowerCase();
    if (lower.includes('sonnet') || lower.includes("lover's complaint")) return 'poetry';
    if (TRAGEDIES.some(t => lower.includes(t))) return 'tragedy';
    if (COMEDIES.some(t => lower.includes(t))) return 'comedy';
    if (HISTORIES.some(t => lower.includes(t))) return 'history';
    return 'play';
  }

  function flushBuffer() {
    if (lineBuffer.length === 0) return;

    const text = lineBuffer.join('\n').trim();
    if (text.length > 20) {
      chunkId++;
      searchChunks.push({
        id: chunkId,
        work: currentWork?.title || 'Unknown',
        workIndex: works.length,
        act: currentAct,
        scene: currentScene,
        text: text,
        searchText: text.toLowerCase()
      });
    }
    lineBuffer = [];
  }

  for (let i = contentStart; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect new work by exact title match from our known list
    const isWorkTitle = WORK_TITLES.has(trimmed);

    if (isWorkTitle) {
      // Skip if we already have this work (title appears multiple times in the file)
      const alreadyHave = works.some(w => w.fullTitle === trimmed) ||
                          (currentWork && currentWork.fullTitle === trimmed);
      if (alreadyHave) continue;

      // Save previous work
      if (currentWork) {
        flushBuffer();
        works.push(currentWork);
      }

      currentWork = {
        title: getDisplayTitle(trimmed),
        fullTitle: trimmed,
        type: getWorkType(trimmed),
        startLine: i,
        acts: []
      };
      currentAct = null;
      currentScene = null;
      continue;
    }

    // Detect THE END
    if (trimmed === 'THE END') {
      flushBuffer();
      if (currentWork) {
        currentWork.endLine = i;
      }
      continue;
    }

    // Detect ACT
    if (trimmed.match(/^ACT [IVX]+\.?$/i) || trimmed.match(/^ACT [IVX]+\. SCENE/i)) {
      flushBuffer();
      const actMatch = trimmed.match(/ACT ([IVX]+)/i);
      if (actMatch) {
        currentAct = actMatch[1];
        if (currentWork) {
          currentWork.acts.push({ act: currentAct, scenes: [] });
        }
      }
      // Check if scene is on same line
      const sceneMatch = trimmed.match(/SCENE (\d+|[IVX]+)/i);
      if (sceneMatch) {
        currentScene = sceneMatch[1];
      }
      continue;
    }

    // Detect SCENE
    if (trimmed.match(/^SCENE [IVX\d]+\.?/i)) {
      flushBuffer();
      const sceneMatch = trimmed.match(/SCENE ([IVX\d]+)/i);
      if (sceneMatch) {
        currentScene = sceneMatch[1];
      }
      continue;
    }

    // Skip stage directions for search but keep for display
    if (trimmed.startsWith('Enter ') || trimmed.startsWith('Exit ') ||
        trimmed.startsWith('Exeunt') || trimmed.startsWith('[')) {
      // Include in buffer for context
    }

    // Buffer content lines
    if (trimmed && currentWork) {
      lineBuffer.push(line);

      // Flush every ~10 lines to create search chunks
      if (lineBuffer.length >= 10) {
        flushBuffer();
      }
    }
  }

  // Flush remaining
  flushBuffer();
  if (currentWork) {
    works.push(currentWork);
  }

  console.log(`Works found: ${works.length}`);
  console.log(`Search chunks: ${searchChunks.length.toLocaleString()}`);

  // Count words
  let totalWords = 0;
  for (const chunk of searchChunks) {
    totalWords += chunk.text.split(/\s+/).length;
  }
  console.log(`Total words: ${totalWords.toLocaleString()}`);

  // Build output
  const output = {
    works: works.map((w, i) => ({
      id: i,
      title: w.title,
      fullTitle: w.fullTitle,
      type: w.type,
      actCount: w.acts.length
    })),
    chunks: searchChunks,
    quotes: FAMOUS_QUOTES,
    insults: {
      col1: INSULT_COL1,
      col2: INSULT_COL2,
      col3: INSULT_COL3
    },
    names: {
      prefixes: NAME_PREFIXES,
      first: NAME_FIRST,
      places: NAME_PLACES
    },
    stats: {
      works: works.length,
      chunks: searchChunks.length,
      words: totalWords,
      lines: lines.length
    },
    generated: new Date().toISOString()
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output));
  console.log(`\nWrote: ${OUTPUT_FILE}`);
  console.log(`Size: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);
}

main();
