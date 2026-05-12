/**
 * fetch-news.js
 * Pulls public news signals from Google News RSS and GDELT,
 * then appends new entries to data/signals.json.
 *
 * Usage:
 *   node scripts/fetch-news.js
 *
 * Prerequisites:
 *   npm install node-fetch fast-xml-parser   (or: npm install)
 *
 * Customization:
 *   - Edit SEARCH_TERMS to change what topics are tracked
 *   - Edit COMPANIES to add or remove tracked companies
 *   - Edit OUTPUT_FILE to change where results are saved
 *   - Set DRY_RUN = true to preview without writing to disk
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ── Configuration ────────────────────────────────────────────
const OUTPUT_FILE = path.resolve(__dirname, '../data/signals.json');
const DRY_RUN = false;           // Set true to preview without saving
const MAX_RESULTS_PER_QUERY = 5; // Google News RSS returns up to ~10 by default

// Search terms — edit these to broaden or narrow coverage
const SEARCH_TERMS = [
  'AI data center',
  'GPU cluster infrastructure',
  'AI infrastructure investment',
  'power purchase agreement nuclear AI',
  'AI capex 2025',
  'Blackwell GPU shipment',
  'AI data center energy',
  'cloud capacity AI expansion',
  'AI training cluster',
];

// Companies to try to auto-tag signals
const COMPANIES = [
  'Meta',
  'Microsoft',
  'Google',
  'Amazon',
  'AWS',
  'Oracle',
  'CoreWeave',
  'xAI',
  'Anthropic',
  'Nvidia',
];

// Map company name variations to canonical IDs in signals.json
const COMPANY_CANONICAL = {
  'Meta': 'Meta',
  'Microsoft': 'Microsoft',
  'Google': 'Google',
  'Alphabet': 'Google',
  'Amazon': 'Amazon',
  'AWS': 'Amazon',
  'Oracle': 'Oracle',
  'CoreWeave': 'CoreWeave',
  'xAI': 'xAI',
  'Anthropic': 'Anthropic',
  'Nvidia': 'Nvidia',
};

// ── Helpers ──────────────────────────────────────────────────

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'AI-Infra-Monitor/1.0 (public research tool)' } }, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function buildGoogleNewsUrl(query) {
  const encoded = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;
}

/** Minimal RSS XML parser — no external dependencies required */
function parseRssItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/) || [])[1] || '';
    const link = (block.match(/<link>(.*?)<\/link>/) || [])[1] || '';
    const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
    const description = (block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || block.match(/<description>(.*?)<\/description>/) || [])[1] || '';
    if (title) items.push({ title: title.trim(), link: link.trim(), pubDate: pubDate.trim(), description: description.trim() });
  }
  return items;
}

function parsePubDate(dateStr) {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function detectCompany(text) {
  const upper = text;
  for (const [name, canonical] of Object.entries(COMPANY_CANONICAL)) {
    if (upper.includes(name)) return canonical;
  }
  return 'Unknown';
}

function detectCategory(text) {
  const lower = text.toLowerCase();
  if (/nuclear|ppa|power purchase|energy|watt|megawatt|gigawatt|renewable/.test(lower)) return 'Energy';
  if (/chip|gpu|tpu|accelerator|silicon|blackwell|trainium|tpu/.test(lower)) return 'Chips';
  if (/capex|capital expenditure|billion invest|spending/.test(lower)) return 'Capex';
  if (/data center|colossus|server farm|co-location/.test(lower)) return 'Data Center';
  if (/cloud|azure|aws|gcp|ec2/.test(lower)) return 'Cloud';
  if (/cluster|compute|inference|training|flop/.test(lower)) return 'Compute';
  return 'Compute';
}

function stripHtml(str) {
  return str.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
}

function generateId(date, company, title) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
  return `rss-${date}-${company.toLowerCase()}-${slug}`;
}

// ── GDELT helper (optional) ───────────────────────────────────
// GDELT API: https://api.gdeltproject.org/api/v2/doc/doc
// Returns JSON articles matching a query. Free, no key required.
async function fetchGdelt(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encoded}&mode=artlist&maxrecords=10&format=json&sourcelang=eng`;
  try {
    const raw = await httpsGet(url);
    const data = JSON.parse(raw);
    return (data.articles || []).map(a => ({
      title: a.title || '',
      link: a.url || '',
      pubDate: a.seendate ? `${a.seendate.slice(0,4)}-${a.seendate.slice(4,6)}-${a.seendate.slice(6,8)}` : '',
      description: a.title || '',
    }));
  } catch {
    return [];
  }
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('🔍 AI Infrastructure Signal Fetcher');
  console.log(`   Output: ${OUTPUT_FILE}`);
  console.log(`   Dry run: ${DRY_RUN}\n`);

  // Load existing signals to avoid duplicates
  let existing = { lastUpdated: new Date().toISOString().slice(0, 10), companies: [], signals: [] };
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    } catch (e) {
      console.warn('  Could not parse existing signals.json, starting fresh.');
    }
  }

  const existingLinks = new Set(existing.signals.map(s => s.sourceLink));
  const newSignals = [];

  for (const term of SEARCH_TERMS) {
    console.log(`  Fetching: "${term}"`);
    let items = [];

    // Try Google News RSS
    try {
      const url = buildGoogleNewsUrl(term);
      const xml = await httpsGet(url);
      items = parseRssItems(xml).slice(0, MAX_RESULTS_PER_QUERY);
      console.log(`    Google News: ${items.length} items`);
    } catch (err) {
      console.warn(`    Google News failed for "${term}": ${err.message}`);
    }

    // Optionally try GDELT if Google News returns nothing
    if (items.length === 0) {
      console.log(`    Trying GDELT fallback...`);
      items = await fetchGdelt(term);
      console.log(`    GDELT: ${items.length} items`);
    }

    for (const item of items) {
      if (existingLinks.has(item.link)) continue;

      const titleClean = stripHtml(item.title);
      const descClean = stripHtml(item.description);
      const fullText = `${titleClean} ${descClean}`;

      const company = detectCompany(fullText);
      const category = detectCategory(fullText);
      const date = parsePubDate(item.pubDate);
      const id = generateId(date, company, titleClean);

      const signal = {
        id,
        date,
        company,
        sourceType: 'News',
        category,
        summary: titleClean,
        strategicImplication: '⚠️ Auto-fetched — review and add strategic implication manually.',
        sourceLink: item.link,
        signalScore: 2,  // Default low score for unreviewed auto-fetched signals
        energyRelated: category === 'Energy',
        tags: ['auto-fetched', 'needs-review'],
        _autoFetched: true,
      };

      newSignals.push(signal);
      existingLinks.add(item.link);
    }

    // Be polite to public APIs — small delay between requests
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\n  Found ${newSignals.length} new signals.`);

  if (newSignals.length === 0) {
    console.log('  Nothing new to add.');
    return;
  }

  if (DRY_RUN) {
    console.log('\n  [DRY RUN] Would add these signals:');
    newSignals.forEach(s => console.log(`    - [${s.date}] ${s.company}: ${s.summary.slice(0, 80)}...`));
    return;
  }

  existing.signals = [...newSignals, ...existing.signals];
  existing.lastUpdated = new Date().toISOString().slice(0, 10);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existing, null, 2));
  console.log(`\n  ✅ Saved ${newSignals.length} new signals to ${OUTPUT_FILE}`);
  console.log('  💡 Tip: Review auto-fetched signals and update signalScore and strategicImplication.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
