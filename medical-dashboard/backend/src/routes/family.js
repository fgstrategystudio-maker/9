import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET all family history
router.get('/', (req, res) => {
  try {
    const family = db.prepare('SELECT * FROM family_history ORDER BY id DESC').all();
    res.json(family);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST family history entry
router.post('/', (req, res) => {
  try {
    const { relative, condition, age_at_diagnosis, notes } = req.body;
    const result = db.prepare('INSERT INTO family_history (relative, condition, age_at_diagnosis, notes) VALUES (?, ?, ?, ?)').run(relative, condition, age_at_diagnosis, notes);
    const entry = db.prepare('SELECT * FROM family_history WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT family history entry
router.put('/:id', (req, res) => {
  try {
    const { relative, condition, age_at_diagnosis, notes } = req.body;
    db.prepare('UPDATE family_history SET relative=?, condition=?, age_at_diagnosis=?, notes=? WHERE id=?').run(relative, condition, age_at_diagnosis, notes, req.params.id);
    const entry = db.prepare('SELECT * FROM family_history WHERE id = ?').get(req.params.id);
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE family history entry
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM family_history WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET lifestyle
router.get('/lifestyle', (req, res) => {
  try {
    const lifestyle = db.prepare('SELECT * FROM lifestyle WHERE id = 1').get();
    res.json(lifestyle || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT lifestyle (upsert)
router.put('/lifestyle', (req, res) => {
  try {
    const {
      sport_type, sport_frequency, sport_intensity, work_type, sleep_hours,
      sleep_quality, diet_notes, alcohol, smoking, stress_notes, pc_hours
    } = req.body;
    const updated_at = new Date().toISOString();

    db.prepare(`
      INSERT OR REPLACE INTO lifestyle (id, sport_type, sport_frequency, sport_intensity, work_type,
        sleep_hours, sleep_quality, diet_notes, alcohol, smoking, stress_notes, pc_hours, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(sport_type, sport_frequency, sport_intensity, work_type, sleep_hours,
           sleep_quality, diet_notes, alcohol, smoking, stress_notes, pc_hours, updated_at);

    const lifestyle = db.prepare('SELECT * FROM lifestyle WHERE id = 1').get();
    res.json(lifestyle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
