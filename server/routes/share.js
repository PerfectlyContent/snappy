import { Router } from 'express';
import { composeForwardMessage, composeReachOutMessage } from '../services/gemini.js';
import { sendEmail } from '../services/email.js';

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

router.post('/send', async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const result = await sendEmail({ to, subject, body });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Send error:', err);
    res.status(500).json({ error: 'Failed to send message', message: err.message });
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
