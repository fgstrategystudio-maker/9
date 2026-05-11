import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'data');
mkdirSync(dataDir, { recursive: true });

export const db = new Database(join(dataDir, 'medical.db'));

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT,
      birth_date TEXT,
      height REAL,
      weight REAL,
      blood_type TEXT,
      gp_name TEXT,
      gp_contact TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS allergies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      name TEXT,
      severity TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS medications_current (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      dosage TEXT,
      frequency TEXT,
      start_date TEXT,
      reason TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS conditions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      diagnosed_date TEXT,
      status TEXT DEFAULT 'active',
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS vaccinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      date TEXT,
      next_date TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_date TEXT,
      end_date TEXT,
      type TEXT,
      body_area TEXT,
      diagnosis TEXT,
      symptoms TEXT,
      intensity INTEGER,
      probable_cause TEXT,
      doctor TEXT,
      facility TEXT,
      therapy TEXT,
      stop_days INTEGER,
      outcome TEXT DEFAULT 'in_corso',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS injuries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
      sport TEXT,
      movement TEXT,
      body_side TEXT,
      pain_type TEXT,
      swelling INTEGER DEFAULT 0,
      hematoma INTEGER DEFAULT 0,
      continued_activity INTEGER DEFAULT 0,
      physiotherapy_sessions INTEGER,
      recurrences INTEGER DEFAULT 0,
      residual_limitations TEXT
    );

    CREATE TABLE IF NOT EXISTS medications_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
      start_date TEXT,
      end_date TEXT,
      name TEXT,
      dosage TEXT,
      reason TEXT,
      effect TEXT,
      reactions TEXT
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      episode_id INTEGER REFERENCES episodes(id) ON DELETE SET NULL,
      date TEXT,
      type TEXT,
      reason TEXT,
      result_summary TEXT,
      file_path TEXT,
      file_name TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS family_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      relative TEXT,
      condition TEXT,
      age_at_diagnosis INTEGER,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS lifestyle (
      id INTEGER PRIMARY KEY DEFAULT 1,
      sport_type TEXT,
      sport_frequency TEXT,
      sport_intensity TEXT,
      work_type TEXT,
      sleep_hours REAL,
      sleep_quality TEXT,
      diet_notes TEXT,
      alcohol TEXT,
      smoking TEXT,
      stress_notes TEXT,
      pc_hours REAL,
      updated_at TEXT
    );
  `);

  console.log('Database initialized');
}
