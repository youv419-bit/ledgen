const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/initDb');
const { auditWebsite } = require('../services/auditService');
const { calculateLeadScore } = require('../services/scoringService');

const router = express.Router();

// POST /api/audit - Run audit on a URL
router.post('/', async (req, res) => {
  try {
    const { url, leadId } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const auditResult = await auditWebsite(url);
    const db = getDb();

    // If lead exists, update its score and audit data
    if (leadId) {
      const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
      if (lead) {
        const parsedLead = {
          ...lead,
          tags: safeParseJson(lead.tags, []),
        };
        const scoreResult = calculateLeadScore(parsedLead, auditResult);

        db.prepare(`
          UPDATE leads SET 
            score = ?,
            score_breakdown = ?,
            audit_data = ?,
            opportunity_report = ?,
            last_audited = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          scoreResult.score,
          JSON.stringify(scoreResult.breakdown),
          JSON.stringify(auditResult),
          JSON.stringify(auditResult.opportunities),
          leadId
        );

        // Save audit record
        const auditId = uuidv4();
        db.prepare(`
          INSERT INTO audits (
            id, lead_id, website, seo_score, performance_score, 
            conversion_score, overall_score, seo_issues, 
            performance_issues, conversion_issues, raw_data
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          auditId,
          leadId,
          url,
          auditResult.seoScore,
          auditResult.performanceScore,
          auditResult.conversionScore,
          auditResult.overallScore,
          JSON.stringify(auditResult.seo?.issues || []),
          JSON.stringify(auditResult.performance?.issues || []),
          JSON.stringify(auditResult.conversion?.issues || []),
          JSON.stringify(auditResult),
        );

        auditResult.leadScore = scoreResult.score;
        auditResult.scoreBreakdown = scoreResult.breakdown;
        auditResult.auditId = auditId;
      }
    }

    res.json(auditResult);
  } catch (err) {
    console.error('Audit error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/audit/history/:leadId
router.get('/history/:leadId', (req, res) => {
  try {
    const db = getDb();
    const audits = db.prepare(`
      SELECT * FROM audits 
      WHERE lead_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(req.params.leadId);
    res.json(audits.map(a => ({
      ...a,
      seo_issues: safeParseJson(a.seo_issues, []),
      performance_issues: safeParseJson(a.performance_issues, []),
      conversion_issues: safeParseJson(a.conversion_issues, []),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function safeParseJson(val, fallback) {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
}

module.exports = router;
