import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generateDailySnap } from '../services/gemini.js';
import { getAuthenticatedClient } from '../services/google-auth.js';
import { getTodayEvents } from '../services/calendar.js';

const router = Router();

router.get('/daily', requireAuth, async (req, res) => {
  try {
    // Fetch today's Google Calendar events if the user signed in with Google
    let events = [];
    if (req.session.provider === 'google' && req.session.tokens) {
      try {
        const auth = getAuthenticatedClient(req.session);
        events = await getTodayEvents(auth);
      } catch (err) {
        console.warn('Could not fetch calendar events for daily snap:', err.message);
      }
    }

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
