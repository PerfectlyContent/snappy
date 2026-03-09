import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getAuthenticatedClient } from '../services/google-auth.js';
import { getTodayEvents } from '../services/calendar.js';
import { generateDailySnap } from '../services/gemini.js';

const router = Router();

router.get('/daily', requireAuth, async (req, res) => {
  try {
    const auth = getAuthenticatedClient(req.session);
    const events = await getTodayEvents(auth);

    // Notes are stored client-side, so the client sends them as a query param
    let notes = [];
    if (req.query.notes) {
      try {
        notes = JSON.parse(decodeURIComponent(req.query.notes));
      } catch {
        // Ignore malformed notes
      }
    }

    const snap = await generateDailySnap(events, notes);

    res.json({
      ...snap,
      events,
      eventCount: events.length,
      noteCount: notes.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Daily snap error:', err);
    res.status(500).json({ error: 'Failed to generate daily snap', message: err.message });
  }
});

export default router;
