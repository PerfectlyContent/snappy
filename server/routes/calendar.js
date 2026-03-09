import { Router } from 'express';
import { requireScope } from '../middleware/auth.js';
import { getAuthenticatedClient } from '../services/google-auth.js';
import { createEvent, getUpcoming } from '../services/calendar.js';

const router = Router();

function isTokenExpiredError(err) {
  const msg = err.message || '';
  return err.code === 401
    || msg.includes('invalid_grant')
    || msg.includes('Token has been expired or revoked')
    || msg.includes('No refresh token');
}

function getGoogleErrorDetail(err) {
  const detail = err.response?.data?.error;
  if (typeof detail === 'object') {
    return detail.message || detail.errors?.[0]?.message || err.message;
  }
  return err.message;
}

router.post('/event', requireScope('calendar'), async (req, res) => {
  try {
    const auth = getAuthenticatedClient(req.session);
    if (!auth) {
      return res.status(401).json({ error: 'Not authenticated', message: 'Google session expired. Please reconnect.' });
    }
    const result = await createEvent(auth, req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Calendar error:', err.message, err.code, err.response?.data || err.stack);
    if (isTokenExpiredError(err)) {
      req.session.tokens = null;
      return res.status(401).json({ error: 'Google session expired', message: 'Your Google session has expired. Please reconnect your account.', reauth: true });
    }
    const detail = getGoogleErrorDetail(err);
    res.status(err.code || 500).json({ error: 'Failed to create event', message: detail });
  }
});

router.get('/upcoming', requireScope('calendar'), async (req, res) => {
  try {
    const auth = getAuthenticatedClient(req.session);
    const events = await getUpcoming(auth);
    res.json({ events });
  } catch (err) {
    console.error('Calendar fetch error:', err.message, err.code, err.response?.data || err.stack);
    if (isTokenExpiredError(err)) {
      req.session.tokens = null;
      return res.status(401).json({ error: 'Google session expired', message: 'Your Google session has expired. Please reconnect your account.', reauth: true });
    }
    const detail = getGoogleErrorDetail(err);
    res.status(err.code || 500).json({ error: 'Failed to fetch events', message: detail });
  }
});

export default router;
