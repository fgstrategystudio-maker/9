import { Router } from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, unlinkSync } from 'fs';
import Anthropic from '@anthropic-ai/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const upload = multer({ dest: join(__dirname, '..', 'uploads', 'tmp') });
const router = Router();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/', upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const mimeType = req.file.mimetype;

  try {
    const fileData = readFileSync(filePath);
    const base64Data = fileData.toString('base64');

    const isPdf = mimeType === 'application/pdf';
    const isImage = mimeType.startsWith('image/');

    if (!isPdf && !isImage) {
      unlinkSync(filePath);
      return res.status(400).json({ error: 'File must be a PDF or image' });
    }

    let contentBlock;
    if (isPdf) {
      contentBlock = {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: base64Data
        }
      };
    } else {
      contentBlock = {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mimeType,
          data: base64Data
        }
      };
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: 'Sei un assistente medico. Estrai strutturalmente le informazioni mediche da questo documento. Rispondi SOLO con un JSON valido con questi campi opzionali: date (YYYY-MM-DD), type (tipo di esame), diagnosis, symptoms, result_summary, doctor, facility, medications (array), notes. Non aggiungere spiegazioni, solo il JSON.',
      messages: [
        {
          role: 'user',
          content: [
            contentBlock,
            {
              type: 'text',
              text: 'Estrai le informazioni mediche da questo documento e restituisci solo il JSON.'
            }
          ]
        }
      ]
    });

    const text = response.content.find(b => b.type === 'text')?.text || '{}';

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonStr = text.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    let extracted;
    try {
      extracted = JSON.parse(jsonStr);
    } catch {
      extracted = {};
    }

    unlinkSync(filePath);
    res.json(extracted);
  } catch (err) {
    try { unlinkSync(filePath); } catch {}
    res.status(500).json({ error: err.message });
  }
});

export default router;
