# AI Infrastructure Competitive Intelligence Monitor

**An AI-assisted competitive intelligence workflow for synthesizing public infrastructure signals into strategic insight.**

---

## What This Is

This dashboard tracks how the world's most significant AI companies are investing in data centers, compute capacity, energy infrastructure, and cloud deployment — and translates those raw signals into executive-ready competitive intelligence.

It is designed for strategy professionals, competitive intelligence analysts, and AI transformation leaders who need to monitor infrastructure signals, not just product launches.

**Companies tracked:** Meta, Microsoft / OpenAI, Google / Alphabet, Amazon / AWS, Oracle, CoreWeave, xAI, Anthropic, Nvidia

**Signal categories:** Compute, Energy, Data Centers, Chips, Cloud, Capital Expenditure, Geography

---

## Why I Built This

AI infrastructure investment is a leading indicator of competitive capability — but it's fragmented across earnings calls, press releases, SEC filings, and trade news. By the time a competitor ships a new model, the infrastructure decision was made 18–36 months earlier.

This tool demonstrates that an AI-augmented competitive intelligence workflow can synthesize those fragmented public signals into a structured, exec-ready view of the competitive landscape.

It is positioned as a **portfolio piece** for competitive intelligence, AI strategy, and AI transformation roles — not as an engineering infrastructure database.

---

## How It Relates to Competitive Intelligence and AI Strategy

Traditional CI focuses on products, pricing, and go-to-market. AI-era CI requires a new layer: **infrastructure intelligence.**

- Who controls compute at scale controls AI product velocity
- Energy procurement is now a strategic constraint, not just an operational cost
- Data center geography shapes latency, data sovereignty, and cost structure
- Custom silicon investments (TPUs, Trainium, MTIA) signal long-term infrastructure independence strategies

This dashboard applies a four-step framework:

1. **Monitor** — public announcements, filings, earnings commentary, partnerships
2. **Categorize** — by compute, energy, data center, chips, cloud, capex, geography
3. **Score** — based on recency, specificity, source credibility, strategic materiality
4. **Synthesize** — translate signals into strategic implications and watch items

---

## How to Run It Locally

No build step required. This is plain HTML, CSS, and JavaScript.

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-infrastructure-ci-monitor.git
cd ai-infrastructure-ci-monitor

# Option 1: Open directly in browser
open index.html

# Option 2: Serve locally (avoids fetch() CORS restrictions)
npx serve .
# or
python3 -m http.server 8080
# Then open http://localhost:8080
```

> **Note:** For the signal feed to load, `index.html` needs to be served over HTTP (not opened as a `file://` URL). Use `npx serve .` or Python's built-in server if you see a blank signal list.

---

## How to Update `data/signals.json`

All signals are stored in `data/signals.json`. You can add new signals manually — no code changes required.

### Signal format

```json
{
  "id": "sig-021",
  "date": "2026-05-12",
  "company": "Meta",
  "sourceType": "Company Announcement",
  "category": "Capex",
  "summary": "One clear sentence describing the signal.",
  "strategicImplication": "What this means competitively — written for an executive audience.",
  "sourceLink": "https://example.com/source",
  "signalScore": 4,
  "energyRelated": false,
  "tags": ["capex", "infrastructure"]
}
```

### Field reference

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier. Use `sig-NNN` format. |
| `date` | string | ISO 8601 date: `YYYY-MM-DD` |
| `company` | string | Must match a company name in the `companies` array |
| `sourceType` | string | `News`, `Company Announcement`, `Filing`, `Partnership`, or `Earnings Call` |
| `category` | string | `Compute`, `Energy`, `Data Center`, `Chips`, `Cloud`, `Capex`, or `Geography` |
| `summary` | string | One clear sentence describing the factual signal |
| `strategicImplication` | string | What this means competitively |
| `sourceLink` | string | URL to the original source |
| `signalScore` | number | 1–5. 5 = critical/material. 3 = moderate. 1 = low/background noise |
| `energyRelated` | boolean | Set `true` to surface in the Energy filter |
| `tags` | array | Optional keywords for internal reference |

---

## Optional: Automated RSS Ingestion

The file `scripts/fetch-news.js` can automatically pull recent news from Google News RSS and GDELT.

```bash
# Install dependencies (only needed for the fetch script)
npm install

# Run the fetcher
node scripts/fetch-news.js
```

The script:
- Searches Google News RSS for infrastructure-related terms
- Falls back to GDELT API for additional coverage (free, no API key required)
- Deduplicates against existing signals
- Auto-tags company, category, and date
- Writes new signals with `signalScore: 2` and a review flag

**After running:** Open `data/signals.json` and update the `strategicImplication` field and `signalScore` for any new auto-fetched signals. Auto-fetched signals are marked with `"_autoFetched": true` for easy identification.

---

## Project Structure

```
├── index.html              # Main dashboard (single-page app)
├── styles.css              # Executive dashboard styling
├── script.js               # Dashboard logic and rendering
├── data/
│   └── signals.json        # All company profiles and signals
├── scripts/
│   └── fetch-news.js       # Optional: automated RSS/GDELT news fetcher
├── package.json            # Only needed if using fetch-news.js
└── README.md
```

---

## Optional Future Improvements

This prototype demonstrates the core concept. A production-grade version could add:

- **Automated RSS ingestion** — scheduled runs of `fetch-news.js` with GitHub Actions
- **LLM-generated executive briefings** — use Claude API to draft strategic summaries from raw signals
- **Earnings transcript parsing** — extract infrastructure mentions from 10-Q filings and earnings call transcripts
- **SEC EDGAR keyword extraction** — programmatically monitor capex guidance and risk factor language
- **Trend detection over time** — visualize signal frequency and score trends by company and category
- **Slack / email digest** — weekly automated briefing to a distribution list
- **Search and semantic filtering** — full-text or embedding-based signal search
- **Executive PDF export** — one-click briefing generation

---

## Positioning

This is a **prototype competitive intelligence tool** using manually curated public signals and a lightweight RSS ingestion pipeline. It is not:

- A real-time data feed
- A production-grade database
- A tool with access to non-public or proprietary information

All data comes from publicly available sources: company newsrooms, earnings call transcripts, SEC filings, and trade press.

---

## License

MIT — free to use, modify, and adapt.
