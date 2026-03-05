import { Router } from 'express';
import { composeForwardMessage, composeReachOutMessage } from '../services/gemini.js';

const router = Router();

router.post('/compose', async (req, res) => {
  try {
    const { classificationData } = req.body;
    if (!classificationData) {
      return res.status(400).json({ error: 'No classification data provided' });
    }

    const message = await composeForwardMessage(classificationData);
    res.json(message);
  } catch (err) {
    console.error('Compose error:', err);
    res.status(500).json({ error: 'Failed to compose message', message: err.message });
  }
});

router.post('/compose-reachout', async (req, res) => {
  try {
    const { contactData, channel } = req.body;
    if (!contactData || !channel) {
      return res.status(400).json({ error: 'Missing contactData or channel' });
    }

    const message = await composeReachOutMessage(contactData, channel);
    res.json(message);
  } catch (err) {
    console.error('Compose reachout error:', err);
    res.status(500).json({ error: 'Failed to compose message', message: err.message });
  }
});

export default router;
