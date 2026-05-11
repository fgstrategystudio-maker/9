import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET all episodes with injuries
router.get('/', (req, res) => {
  try {
    const episodes = db.prepare(`
      SELECT e.*, i.id as injury_id, i.sport, i.movement, i.body_side, i.pain_type,
             i.swelling, i.hematoma, i.continued_activity, i.physiotherapy_sessions,
             i.recurrences, i.residual_limitations
      FROM episodes e
      LEFT JOIN injuries i ON i.episode_id = e.id
      ORDER BY e.start_date DESC
    `).all();

    // Group episodes with their injury data
    const result = episodes.map(ep => {
      const { injury_id, sport, movement, body_side, pain_type, swelling, hematoma,
              continued_activity, physiotherapy_sessions, recurrences, residual_limitations, ...episode } = ep;
      if (injury_id) {
        episode.injury = { id: injury_id, sport, movement, body_side, pain_type, swelling, hematoma,
                           continued_activity, physiotherapy_sessions, recurrences, residual_limitations };
      }
      return episode;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single episode with injury and medications
router.get('/:id', (req, res) => {
  try {
    const episode = db.prepare('SELECT * FROM episodes WHERE id = ?').get(req.params.id);
    if (!episode) return res.status(404).json({ error: 'Episode not found' });

    const injury = db.prepare('SELECT * FROM injuries WHERE episode_id = ?').get(req.params.id);
    const medications = db.prepare('SELECT * FROM medications_history WHERE episode_id = ?').all(req.params.id);

    res.json({ ...episode, injury: injury || null, medications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST episode
router.post('/', (req, res) => {
  try {
    const {
      start_date, end_date, type, body_area, diagnosis, symptoms, intensity,
      probable_cause, doctor, facility, therapy, stop_days, outcome, notes, injury
    } = req.body;

    const result = db.prepare(`
      INSERT INTO episodes (start_date, end_date, type, body_area, diagnosis, symptoms, intensity,
        probable_cause, doctor, facility, therapy, stop_days, outcome, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(start_date, end_date, type, body_area, diagnosis, symptoms, intensity,
           probable_cause, doctor, facility, therapy, stop_days, outcome || 'in_corso', notes);

    const episodeId = result.lastInsertRowid;

    if (injury && type === 'infortunio') {
      db.prepare(`
        INSERT INTO injuries (episode_id, sport, movement, body_side, pain_type, swelling,
          hematoma, continued_activity, physiotherapy_sessions, recurrences, residual_limitations)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(episodeId, injury.sport, injury.movement, injury.body_side, injury.pain_type,
             injury.swelling ? 1 : 0, injury.hematoma ? 1 : 0, injury.continued_activity ? 1 : 0,
             injury.physiotherapy_sessions, injury.recurrences || 0, injury.residual_limitations);
    }

    const episode = db.prepare('SELECT * FROM episodes WHERE id = ?').get(episodeId);
    const injuryData = db.prepare('SELECT * FROM injuries WHERE episode_id = ?').get(episodeId);

    res.status(201).json({ ...episode, injury: injuryData || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT episode
router.put('/:id', (req, res) => {
  try {
    const {
      start_date, end_date, type, body_area, diagnosis, symptoms, intensity,
      probable_cause, doctor, facility, therapy, stop_days, outcome, notes
    } = req.body;

    db.prepare(`
      UPDATE episodes SET start_date=?, end_date=?, type=?, body_area=?, diagnosis=?, symptoms=?,
        intensity=?, probable_cause=?, doctor=?, facility=?, therapy=?, stop_days=?, outcome=?, notes=?
      WHERE id=?
    `).run(start_date, end_date, type, body_area, diagnosis, symptoms, intensity,
           probable_cause, doctor, facility, therapy, stop_days, outcome, notes, req.params.id);

    const episode = db.prepare('SELECT * FROM episodes WHERE id = ?').get(req.params.id);
    res.json(episode);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE episode
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM episodes WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST medication history for episode
router.post('/:id/medications', (req, res) => {
  try {
    const { start_date, end_date, name, dosage, reason, effect, reactions } = req.body;
    const result = db.prepare(`
      INSERT INTO medications_history (episode_id, start_date, end_date, name, dosage, reason, effect, reactions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.params.id, start_date, end_date, name, dosage, reason, effect, reactions);

    const med = db.prepare('SELECT * FROM medications_history WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(med);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE medication history
router.delete('/:id/medications/:mid', (req, res) => {
  try {
    db.prepare('DELETE FROM medications_history WHERE id = ? AND episode_id = ?').run(req.params.mid, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
