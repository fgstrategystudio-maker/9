import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET all profile data
router.get('/', (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get();
    const allergies = db.prepare('SELECT * FROM allergies').all();
    const medications_current = db.prepare('SELECT * FROM medications_current').all();
    const conditions = db.prepare('SELECT * FROM conditions').all();
    const vaccinations = db.prepare('SELECT * FROM vaccinations').all();

    res.json({ profile: profile || {}, allergies, medications_current, conditions, vaccinations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT profile (upsert)
router.put('/', (req, res) => {
  try {
    const { name, birth_date, height, weight, blood_type, gp_name, gp_contact } = req.body;
    const updated_at = new Date().toISOString();

    db.prepare(`
      INSERT OR REPLACE INTO profile (id, name, birth_date, height, weight, blood_type, gp_name, gp_contact, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, birth_date, height, weight, blood_type, gp_name, gp_contact, updated_at);

    const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST allergy
router.post('/allergies', (req, res) => {
  try {
    const { type, name, severity, notes } = req.body;
    const result = db.prepare('INSERT INTO allergies (type, name, severity, notes) VALUES (?, ?, ?, ?)').run(type, name, severity, notes);
    const allergy = db.prepare('SELECT * FROM allergies WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(allergy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE allergy
router.delete('/allergies/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM allergies WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST medication (current)
router.post('/medications', (req, res) => {
  try {
    const { name, dosage, frequency, start_date, reason, notes } = req.body;
    const result = db.prepare('INSERT INTO medications_current (name, dosage, frequency, start_date, reason, notes) VALUES (?, ?, ?, ?, ?, ?)').run(name, dosage, frequency, start_date, reason, notes);
    const med = db.prepare('SELECT * FROM medications_current WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(med);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE medication (current)
router.delete('/medications/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM medications_current WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST condition
router.post('/conditions', (req, res) => {
  try {
    const { name, diagnosed_date, status, notes } = req.body;
    const result = db.prepare('INSERT INTO conditions (name, diagnosed_date, status, notes) VALUES (?, ?, ?, ?)').run(name, diagnosed_date, status || 'active', notes);
    const condition = db.prepare('SELECT * FROM conditions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(condition);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT condition
router.put('/conditions/:id', (req, res) => {
  try {
    const { name, diagnosed_date, status, notes } = req.body;
    db.prepare('UPDATE conditions SET name = ?, diagnosed_date = ?, status = ?, notes = ? WHERE id = ?').run(name, diagnosed_date, status, notes, req.params.id);
    const condition = db.prepare('SELECT * FROM conditions WHERE id = ?').get(req.params.id);
    res.json(condition);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE condition
router.delete('/conditions/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM conditions WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST vaccination
router.post('/vaccinations', (req, res) => {
  try {
    const { name, date, next_date, notes } = req.body;
    const result = db.prepare('INSERT INTO vaccinations (name, date, next_date, notes) VALUES (?, ?, ?, ?)').run(name, date, next_date, notes);
    const vax = db.prepare('SELECT * FROM vaccinations WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(vax);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE vaccination
router.delete('/vaccinations/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM vaccinations WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
