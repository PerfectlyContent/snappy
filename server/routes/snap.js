import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generateDailySnap } from '../services/gemini.js';
import { getAuthenticatedClient } from '../services/google-auth.js';
import { getTodayEvents } from '../services/calendar.js';

const router = Router();

// In-memory cache: userId -> { data, expiresAt }
const snapCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

router.get('/daily', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId || req.session.email || 'anonymous';
    const cached = snapCache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json({ ...cached.data, cached: true });
    }

    // Fetch today's Google Calendar events if the user signed in with Google
    let events = [];
    if (req.session.calendarConnected && req.session.tokens) {
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

    const result = {
      ...snap,
      events,
      eventCount: events.length,
      noteCount: notes.length,
      generatedAt: new Date().toISOString(),
    };

    snapCache.set(userId, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });

    res.json(result);
  } catch (err) {
    console.error('Daily snap error:', err);
    res.status(500).json({ error: 'Failed to generate daily snap', message: err.message });
  }
});

export default router;
