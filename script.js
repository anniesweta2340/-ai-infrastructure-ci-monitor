/* ============================================================
   AI Infrastructure Competitive Intelligence Monitor
   script.js — Dashboard logic
   ============================================================ */

const INSIGHT_CARDS = [
  {
    icon: '🖥️',
    color: '#2563eb',
    colorLight: '#eff6ff',
    title: 'Compute Capacity Is Becoming a Strategic Moat',
    body: 'Companies that control GPU clusters at scale — whether through ownership (Meta, Google) or exclusive partnerships (CoreWeave/Microsoft) — can iterate on AI models and products faster than competitors constrained by market allocation. Compute access is no longer just a cost center; it is a pacing mechanism for product development velocity.'
  },
  {
    icon: '⚡',
    color: '#d97706',
    colorLight: '#fffbeb',
    title: 'Energy Access Is Now a Competitive Constraint',
    body: 'Data center buildouts are increasingly gated by power procurement, not capital or hardware. Companies securing long-term nuclear PPAs (Microsoft, Google, Amazon) are locking in structural cost advantages and capacity floors. Energy strategy is now a core competency for any company building at AI scale.'
  },
  {
    icon: '☁️',
    color: '#0891b2',
    colorLight: '#ecfeff',
    title: 'Hyperscalers Have Distribution and Cloud Advantages',
    body: 'AWS, Azure, and Google Cloud already host the majority of enterprise compute workloads. Their AI infrastructure investments deepen existing switching costs and make their platforms the default choice for enterprise AI deployment. The cloud channel advantage compounds as AI workloads become mission-critical.'
  },
  {
    icon: '⬡',
    color: '#7c3aed',
    colorLight: '#f5f3ff',
    title: 'Specialized Infrastructure Is Reshaping the GPU Supply Chain',
    body: 'CoreWeave, Oracle, and xAI represent a new infrastructure archetype — purpose-built AI data centers that exist outside the traditional hyperscaler model. These players are absorbing GPU supply that once went exclusively to AWS/Azure/GCP, creating alternative capacity markets and shifting the competitive dynamics of who controls AI compute.'
  }
];

const META_IMPLICATIONS = [
  {
    number: '01',
    title: 'Infrastructure Scale Affects AI Product Deployment Speed',
    body: "Meta's $65B+ capex commitment directly determines how fast it can train, evaluate, and deploy AI models across Facebook, Instagram, WhatsApp, and Threads. Competitors with constrained compute iterate more slowly — making infrastructure investment a product velocity multiplier."
  },
  {
    number: '02',
    title: 'Energy and Geography Determine Long-Term Cost Advantage',
    body: "The cheapest AI inference at scale will flow to companies with locked-in, low-cost power agreements and strategically located data centers. Meta's Louisiana and Wyoming expansions signal awareness of this dynamic — long-term energy costs matter as much as GPU pricing for inference economics at 3B+ user scale."
  },
  {
    number: '03',
    title: 'Competitive Intelligence Teams Need to Monitor Infrastructure, Not Just Products',
    body: "A competitor's model release is the visible event, but the infrastructure investment was made 18–36 months earlier. Tracking data center announcements, GPU procurement signals, and energy PPAs provides a leading indicator of competitive capability — before products ship."
  },
  {
    number: '04',
    title: 'AI Infrastructure Could Become a Durable Source of Ecosystem Power',
    body: "Companies that build infrastructure at sufficient scale can become platform providers to others — creating revenue streams and ecosystem dependencies beyond their own products. Oracle's emergence as training infrastructure for AI labs is a preview of this dynamic. Meta's infrastructure choices will shape whether it becomes an infrastructure platform or remains solely a consumer of it."
  }
];

const METHODOLOGY_STEPS = [
  {
    num: '1',
    title: 'Monitor Public Signals',
    body: 'Track company announcements, earnings call transcripts, SEC filings (10-K/10-Q capex disclosures), newsroom posts, and infrastructure partnership announcements from major AI companies and their key suppliers.'
  },
  {
    num: '2',
    title: 'Categorize by Signal Type',
    body: 'Classify each signal across seven dimensions: Compute capacity, Energy procurement, Data Center location/scale, Chips and silicon, Cloud infrastructure, Capital expenditure, and Geographic expansion.'
  },
  {
    num: '3',
    title: 'Score by Strategic Relevance',
    body: 'Assign a 1–5 signal strength score based on four factors: recency (how fresh), specificity (dollar amounts, MW capacity, GPU counts), source credibility (earnings call vs. blog post), and strategic materiality (does this change competitive position?).'
  },
  {
    num: '4',
    title: 'Generate Executive Insight',
    body: 'Translate scored signals into concise strategic implications — what this means for competitive dynamics, which companies are advantaged, what risks this creates, and what leading indicators to monitor next.'
  }
];

let allSignals = [];
let allCompanies = [];
let activeCompanyId = null;

async function loadData() {
  const resp = await fetch('data/signals.json');
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

function scoreStars(score, max = 5) {
  return Array.from({ length: max }, (_, i) =>
    `<span class="score-star ${i < score ? 'lit' : ''}">●</span>`
  ).join('');
}

function scoreDots(score, max = 5) {
  return Array.from({ length: max }, (_, i) =>
    `<span class="score-dot ${i < score ? 'filled' : 'empty'}"></span>`
  ).join('');
}

function categoryClass(cat) {
  if (!cat) return '';
  const lower = cat.toLowerCase();
  if (lower.includes('hyperscaler')) return 'category-hyperscaler';
  if (lower.includes('ai lab')) return 'category-ai-lab';
  if (lower.includes('infrastructure')) return 'category-infrastructure';
  if (lower.includes('chip') || lower.includes('gpu')) return 'category-chip';
  return 'category-ai-lab';
}

function sourceBadgeClass(src) {
  const map = {
    'news': 'badge-news',
    'company announcement': 'badge-announcement',
    'filing': 'badge-filing',
    'partnership': 'badge-partnership',
    'earnings call': 'badge-earnings'
  };
  return map[(src || '').toLowerCase()] || 'badge-news';
}

function categoryBadgeClass(cat) {
  const map = {
    'compute': 'badge-compute',
    'energy': 'badge-energy',
    'data center': 'badge-datacenter',
    'chips': 'badge-chips',
    'cloud': 'badge-cloud',
    'capex': 'badge-capex',
    'geography': 'badge-geography'
  };
  return map[(cat || '').toLowerCase()] || 'badge-compute';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── Hero Stats ── */
function renderHeroStats(data) {
  const totalCapex = '$220B+';
  const el = document.getElementById('hero-stats');
  el.innerHTML = `
    <div class="hero-stat">
      <span class="hero-stat-value">${data.companies.length}</span>
      <span class="hero-stat-label">Companies Tracked</span>
    </div>
    <div class="hero-stat">
      <span class="hero-stat-value">${data.signals.length}</span>
      <span class="hero-stat-label">Signals Indexed</span>
    </div>
    <div class="hero-stat">
      <span class="hero-stat-value">${totalCapex}</span>
      <span class="hero-stat-label">Combined 2025 Capex (est.)</span>
    </div>
    <div class="hero-stat">
      <span class="hero-stat-value">${data.signals.filter(s => s.energyRelated).length}</span>
      <span class="hero-stat-label">Energy-Related Signals</span>
    </div>
  `;
  document.getElementById('footer-date').textContent = formatDate(data.lastUpdated);
}

/* ── Insight Cards ── */
function renderInsightCards() {
  const grid = document.getElementById('insight-grid');
  grid.innerHTML = INSIGHT_CARDS.map(c => `
    <div class="insight-card" style="--card-color:${c.color}; --card-color-light:${c.colorLight}">
      <div class="insight-card-icon">${c.icon}</div>
      <div class="insight-card-title">${c.title}</div>
      <div class="insight-card-body">${c.body}</div>
    </div>
  `).join('');
}

/* ── Company Cards ── */
function renderCompanyCards(companies) {
  const grid = document.getElementById('company-grid');
  grid.innerHTML = companies.map(co => `
    <div class="company-card ${activeCompanyId === co.id ? 'active' : ''}"
         data-id="${co.id}" role="button" tabindex="0"
         aria-expanded="${activeCompanyId === co.id}"
         aria-label="View details for ${co.name}">
      <div class="company-card-header">
        <div>
          <div class="company-card-name">${co.name}</div>
          <div class="company-card-category ${categoryClass(co.category)} signal-badge" style="margin-top:4px">${co.category}</div>
        </div>
        <div class="company-score" aria-label="Signal score: ${co.signalScore} out of 5">
          ${scoreDots(co.signalScore)}
        </div>
      </div>
      <div class="company-card-field">
        <div class="company-card-field-label">Strategic Focus</div>
        <div class="company-card-field-value">${co.strategicFocus}</div>
      </div>
      <div class="company-card-field">
        <div class="company-card-field-label">Energy Strategy</div>
        <div class="company-card-field-value">${co.energyStrategy}</div>
      </div>
      <div class="company-card-field">
        <div class="company-card-field-label">Competitive Implication</div>
        <div class="company-card-field-value">${co.competitiveImplication}</div>
      </div>
      <div class="company-card-footer">
        <span class="company-card-footer-date">Updated ${formatDate(co.lastUpdated)}</span>
        <span class="company-card-cta">${activeCompanyId === co.id ? 'Close ↑' : 'Full brief →'}</span>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.company-card').forEach(card => {
    card.addEventListener('click', () => handleCompanyClick(card.dataset.id));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCompanyClick(card.dataset.id); }
    });
  });
}

/* ── Company Detail Panel ── */
function handleCompanyClick(id) {
  if (activeCompanyId === id) {
    activeCompanyId = null;
    document.getElementById('detail-panel').classList.remove('visible');
  } else {
    activeCompanyId = id;
    const co = allCompanies.find(c => c.id === id);
    if (co) renderDetailPanel(co);
  }
  renderCompanyCards(allCompanies);
}

function renderDetailPanel(co) {
  const panel = document.getElementById('detail-panel');
  panel.innerHTML = `
    <div class="detail-panel-header">
      <div>
        <div class="detail-panel-title">${co.name}</div>
        <div class="company-card-category ${categoryClass(co.category)} signal-badge" style="margin-top:6px">${co.category}</div>
      </div>
      <button class="detail-panel-close" id="detail-close" aria-label="Close detail panel">✕</button>
    </div>

    <div class="detail-thesis">${co.thesis}</div>

    <div class="detail-grid">
      <div class="detail-block">
        <div class="detail-block-title">Risks &amp; Constraints</div>
        <ul class="detail-list">
          ${co.risks.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
      <div class="detail-block">
        <div class="detail-block-title">What to Monitor Next</div>
        <ul class="detail-list">
          ${co.monitorNext.map(m => `<li>${m}</li>`).join('')}
        </ul>
      </div>
      <div class="detail-block">
        <div class="detail-block-title">Key Partners</div>
        <div class="tag-list">
          ${co.keyPartners.map(p => `<span class="tag">${p}</span>`).join('')}
        </div>
      </div>
      <div class="detail-block">
        <div class="detail-block-title">Why It Matters Competitively</div>
        <div class="detail-block-content">${co.whyItMatters}</div>
      </div>
    </div>
  `;
  panel.classList.add('visible');
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  document.getElementById('detail-close').addEventListener('click', () => {
    activeCompanyId = null;
    panel.classList.remove('visible');
    renderCompanyCards(allCompanies);
  });
}

/* ── Signal Feed ── */
function populateCompanyFilter(companies) {
  const sel = document.getElementById('filter-company');
  companies.forEach(co => {
    const opt = document.createElement('option');
    opt.value = co.name;
    opt.textContent = co.name;
    sel.appendChild(opt);
  });
}

function getActiveFilters() {
  return {
    company: document.getElementById('filter-company').value,
    category: document.getElementById('filter-category').value,
    source: document.getElementById('filter-source').value,
    score: parseInt(document.getElementById('filter-score').value, 10) || 0,
    energyOnly: document.getElementById('filter-energy').checked
  };
}

function filterSignals(signals, filters) {
  return signals
    .filter(s => {
      if (filters.company && s.company !== filters.company) return false;
      if (filters.category && s.category !== filters.category) return false;
      if (filters.source && s.sourceType !== filters.source) return false;
      if (s.signalScore < filters.score) return false;
      if (filters.energyOnly && !s.energyRelated) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderSignalCard(sig) {
  return `
    <div class="signal-card" role="listitem">
      <div class="signal-card-header">
        <span class="signal-date">${formatDate(sig.date)}</span>
        <span class="signal-company-badge">${sig.company}</span>
        <span class="signal-badge ${sourceBadgeClass(sig.sourceType)}">${sig.sourceType}</span>
        <span class="signal-badge ${categoryBadgeClass(sig.category)}">${sig.category}</span>
        ${sig.energyRelated ? '<span class="signal-badge badge-energy">⚡ Energy</span>' : ''}
      </div>
      <div class="signal-summary">${sig.summary}</div>
      <div class="signal-implication">${sig.strategicImplication}</div>
      <div class="signal-card-footer">
        <a class="signal-source-link" href="${sig.sourceLink}" target="_blank" rel="noopener noreferrer">
          View source ↗
        </a>
        <div class="signal-score" aria-label="Signal strength: ${sig.signalScore} out of 5">
          <span class="signal-score-label">Signal Strength</span>
          <span class="score-stars signal-score-dots">${scoreStars(sig.signalScore)}</span>
        </div>
      </div>
      ${sig.tags && sig.tags.length ? `<div class="tag-list">${sig.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
    </div>
  `;
}

function renderSignals(signals) {
  const list = document.getElementById('signal-list');
  const count = document.getElementById('signals-count');

  if (!signals.length) {
    list.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <div class="no-results-text">No signals match the current filters.</div>
      </div>`;
    count.innerHTML = 'Showing <strong>0</strong> signals';
    return;
  }

  list.innerHTML = signals.map(renderSignalCard).join('');
  count.innerHTML = `Showing <strong>${signals.length}</strong> of <strong>${allSignals.length}</strong> signals`;
}

function applyFilters() {
  const filtered = filterSignals(allSignals, getActiveFilters());
  renderSignals(filtered);
}

function bindFilters() {
  ['filter-company', 'filter-category', 'filter-source', 'filter-score'].forEach(id => {
    document.getElementById(id).addEventListener('change', applyFilters);
  });

  const energyCheck = document.getElementById('filter-energy');
  const energyToggle = document.getElementById('filter-energy-toggle');
  energyCheck.addEventListener('change', () => {
    energyToggle.classList.toggle('active', energyCheck.checked);
    applyFilters();
  });
  energyToggle.addEventListener('click', e => {
    if (e.target !== energyCheck) {
      energyCheck.checked = !energyCheck.checked;
      energyToggle.classList.toggle('active', energyCheck.checked);
      applyFilters();
    }
  });

  document.getElementById('btn-reset-filters').addEventListener('click', () => {
    document.getElementById('filter-company').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-source').value = '';
    document.getElementById('filter-score').value = '0';
    document.getElementById('filter-energy').checked = false;
    document.getElementById('filter-energy-toggle').classList.remove('active');
    applyFilters();
  });
}

/* ── Meta Implications ── */
function renderImplications() {
  const grid = document.getElementById('implications-grid');
  grid.innerHTML = META_IMPLICATIONS.map(imp => `
    <div class="implication-card">
      <div class="implication-number">${imp.number}</div>
      <div class="implication-title">${imp.title}</div>
      <div class="implication-body">${imp.body}</div>
    </div>
  `).join('');
}

/* ── Methodology ── */
function renderMethodology() {
  const grid = document.getElementById('methodology-steps');
  grid.innerHTML = METHODOLOGY_STEPS.map(step => `
    <div class="method-step">
      <div class="method-step-num">${step.num}</div>
      <div class="method-step-title">${step.title}</div>
      <div class="method-step-body">${step.body}</div>
    </div>
  `).join('');
}

/* ── Init ── */
async function init() {
  try {
    const data = await loadData();
    allSignals = data.signals || [];
    allCompanies = data.companies || [];

    renderHeroStats(data);
    renderInsightCards();
    renderCompanyCards(allCompanies);
    populateCompanyFilter(allCompanies);
    renderSignals(allSignals.slice().sort((a, b) => new Date(b.date) - new Date(a.date)));
    document.getElementById('signals-count').innerHTML =
      `Showing <strong>${allSignals.length}</strong> of <strong>${allSignals.length}</strong> signals`;
    renderImplications();
    renderMethodology();
    bindFilters();
  } catch (err) {
    console.error('Failed to load signals data:', err);
    document.getElementById('signal-list').innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">⚠️</div>
        <div class="no-results-text">Unable to load signals. Ensure data/signals.json is present.</div>
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
