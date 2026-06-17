const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../models/initDb');
const { generateOutreach } = require('../services/outreachService');

const router = express.Router();

// POST /api/outreach/generate
router.post('/generate', (req, res) => {
  try {
    const { leadId, type } = req.body;
    const db = getDb();

    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const auditData = lead.audit_data ? JSON.parse(lead.audit_data) : null;
    const outreach = generateOutreach(lead, auditData, type);

    // Save to outreach table
    const id = uuidv4();
    db.prepare(`
      INSERT INTO outreach (id, lead_id, type, subject, content)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, leadId, type, outreach.subject, outreach.body);

    res.json({ id, ...outreach });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/outreach/:leadId
router.get('/:leadId', (req, res) => {
  try {
    const db = getDb();
    const messages = db.prepare(`
      SELECT * FROM outreach WHERE lead_id = ? ORDER BY created_at DESC
    `).all(req.params.leadId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/outreach/:id/status
router.patch('/:id/status', (req, res) => {
  try {
    const db = getDb();
    const { status } = req.body;
    db.prepare('UPDATE outreach SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
