import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generateDailySnap } from '../services/gemini.js';

const router = Router();

router.get('/daily', requireAuth, async (req, res) => {
  try {
    // Calendar events are no longer fetched server-side (no sensitive scopes).
    // The snap is generated from notes only.
    const events = [];

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
