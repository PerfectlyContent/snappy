import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getAuthenticatedClient } from '../services/google-auth.js';
import { createEvent, getUpcoming } from '../services/calendar.js';

const router = Router();

router.post('/event', requireAuth, async (req, res) => {
  try {
    const auth = getAuthenticatedClient(req.session);
    const result = await createEvent(auth, req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Calendar error:', err);
    res.status(500).json({ error: 'Failed to create event', message: err.message });
  }
});

router.get('/upcoming', requireAuth, async (req, res) => {
  try {
    const auth = getAuthenticatedClient(req.session);
    const events = await getUpcoming(auth);
    res.json({ events });
  } catch (err) {
    console.error('Calendar fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch events', message: err.message });
  }
});

export default router;
