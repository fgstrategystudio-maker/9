import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDb } from './db.js';

import profileRouter from './routes/profile.js';
import episodesRouter from './routes/episodes.js';
import examsRouter from './routes/exams.js';
import familyRouter from './routes/family.js';
import extractRouter from './routes/extract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

initDb();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Static file serving for uploads
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Routes
app.use('/api/profile', profileRouter);
app.use('/api/episodes', episodesRouter);
app.use('/api/exams', examsRouter);
app.use('/api/family', familyRouter);
app.use('/api/extract', extractRouter);

app.listen(PORT, () => {
  console.log(`Medical Dashboard backend running on port ${PORT}`);
});
