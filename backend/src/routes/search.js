const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/initDb');
const { searchLeads } = require('../services/searchService');
const { analyzeWebsite } = require('../services/detectionService');
const { auditWebsite } = require('../services/auditService');
const { calculateLeadScore } = require('../services/scoringService');

const router = express.Router();

// POST /api/search - Search for leads
router.post('/', async (req, res) => {
  try {
    const { country, industry, platform, limit = 20 } = req.body;
    const db = getDb();

    // Log search history
    const searchId = uuidv4();
    db.prepare(`
      INSERT INTO search_history (id, country, industry, platform, results_count)
      VALUES (?, ?, ?, ?, 0)
    `).run(searchId, country, industry, platform);

    // Get leads from search service
    const rawLeads = await searchLeads({ country, industry, platform, limit });

    // Save to DB
    const savedLeads = [];
    for (const raw of rawLeads) {
      const existing = db.prepare('SELECT id FROM leads WHERE website = ?').get(raw.website);
      if (existing) {
        savedLeads.push({ ...existing, ...raw, id: existing.id, isNew: false });
        continue;
      }

      const id = uuidv4();
      const scoreResult = calculateLeadScore(raw, null);

      db.prepare(`
        INSERT OR IGNORE INTO leads (
          id, company_name, website, country, platform, industry,
          email, linkedin_url, facebook_url, instagram_url, phone,
          store_age_estimate, technology_stack, theme, score, score_breakdown,
          status, tags, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', '[]', CURRENT_TIMESTAMP)
      `).run(
        id,
        raw.company_name || null,
        raw.website,
        raw.country || null,
        raw.platform || null,
        raw.industry || null,
        raw.email || null,
        raw.linkedinUrl || null,
        raw.facebookUrl || null,
        raw.instagramUrl || null,
        raw.phone || null,
        raw.storeAgeEstimate || raw.store_age_estimate || null,
        raw.technologyStack || raw.technology_stack || null,
        raw.theme || null,
        scoreResult.score,
        JSON.stringify(scoreResult.breakdown),
      );

      savedLeads.push({ id, ...raw, score: scoreResult.score, isNew: true });
    }

    // Update search history count
    db.prepare('UPDATE search_history SET results_count = ? WHERE id = ?')
      .run(savedLeads.length, searchId);

    res.json({
      leads: savedLeads,
      total: savedLeads.length,
      searchId,
      message: `Found ${savedLeads.length} leads`,
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/search/analyze - Analyze a single URL
router.post('/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const analysis = await analyzeWebsite(url);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/search/history
router.get('/history', (req, res) => {
  try {
    const db = getDb();
    const history = db.prepare(`
      SELECT * FROM search_history 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
