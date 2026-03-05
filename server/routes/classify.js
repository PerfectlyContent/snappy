import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { classifyLimiter } from '../middleware/rateLimit.js';
import { classifyImage, classifyVoice } from '../services/gemini.js';

const router = Router();

router.post('/image', classifyLimiter, upload.single('image'), async (req, res) => {
  try {
    let imageBase64, mimeType;

    if (req.file) {
      imageBase64 = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype;
    } else if (req.body.image) {
      const match = req.body.image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        imageBase64 = match[2];
      } else {
        imageBase64 = req.body.image;
        mimeType = req.body.mimeType || 'image/png';
      }
    } else {
      return res.status(400).json({ error: 'No image provided' });
    }

    const result = await classifyImage(imageBase64, mimeType);
    res.json(result);
  } catch (err) {
    console.error('Classification error:', err);
    res.status(500).json({ error: 'Classification failed', message: err.message });
  }
});

router.post('/voice', classifyLimiter, async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'No transcript provided' });
    }

    const result = await classifyVoice(transcript);
    res.json(result);
  } catch (err) {
    console.error('Voice classification error:', err);
    res.status(500).json({ error: 'Voice parsing failed', message: err.message });
  }
});

export default router;
