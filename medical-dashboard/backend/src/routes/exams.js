import { Router } from 'express';
import { db } from '../db.js';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const upload = multer({ dest: join(__dirname, '..', 'uploads') });
const router = Router();

// GET all exams
router.get('/', (req, res) => {
  try {
    const { episode_id } = req.query;
    let exams;
    if (episode_id) {
      exams = db.prepare('SELECT * FROM exams WHERE episode_id = ? ORDER BY date DESC').all(episode_id);
    } else {
      exams = db.prepare('SELECT * FROM exams ORDER BY date DESC').all();
    }
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single exam
router.get('/:id', (req, res) => {
  try {
    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST exam (with optional file upload)
router.post('/', upload.single('file'), (req, res) => {
  try {
    const { episode_id, date, type, reason, result_summary } = req.body;
    let file_path = null;
    let file_name = null;

    if (req.file) {
      file_path = req.file.filename;
      file_name = req.file.originalname;
    }

    const result = db.prepare(`
      INSERT INTO exams (episode_id, date, type, reason, result_summary, file_path, file_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(episode_id || null, date, type, reason, result_summary, file_path, file_name);

    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT exam (metadata only)
router.put('/:id', (req, res) => {
  try {
    const { episode_id, date, type, reason, result_summary } = req.body;
    db.prepare(`
      UPDATE exams SET episode_id=?, date=?, type=?, reason=?, result_summary=? WHERE id=?
    `).run(episode_id || null, date, type, reason, result_summary, req.params.id);

    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE exam (keep file on disk)
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM exams WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
