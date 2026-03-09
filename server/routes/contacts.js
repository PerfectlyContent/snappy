import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getAuthenticatedClient } from '../services/google-auth.js';
import { createContact, getRecentContacts, searchContacts } from '../services/contacts.js';

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

router.post('/create', requireAuth, async (req, res) => {
  try {
    const auth = getAuthenticatedClient(req.session);
    if (!auth) {
      return res.status(401).json({ error: 'Not authenticated', message: 'Google session expired. Please reconnect.' });
    }
    const result = await createContact(auth, req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Contacts error:', err.message, err.code, err.response?.data || err.stack);
    if (isTokenExpiredError(err)) {
      req.session.tokens = null;
      return res.status(401).json({ error: 'Google session expired', message: 'Your Google session has expired. Please reconnect your account.', reauth: true });
    }
    const detail = getGoogleErrorDetail(err);
    res.status(err.code || 500).json({ error: 'Failed to create contact', message: detail });
  }
});

router.get('/search', requireAuth, async (req, res) => {
  try {
    const auth = getAuthenticatedClient(req.session);
    if (!auth) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const contacts = await searchContacts(auth, req.query.q || '');
    res.json({ contacts });
  } catch (err) {
    console.error('Contact search error:', err.message);
    if (isTokenExpiredError(err)) {
      req.session.tokens = null;
      return res.status(401).json({ error: 'Google session expired', reauth: true });
    }
    res.status(500).json({ error: 'Failed to search contacts', message: err.message });
  }
});

router.get('/recent', requireAuth, async (req, res) => {
  try {
    const auth = getAuthenticatedClient(req.session);
    const contacts = await getRecentContacts(auth);
    res.json({ contacts });
  } catch (err) {
    console.error('Contacts fetch error:', err.message, err.code, err.response?.data || err.stack);
    if (isTokenExpiredError(err)) {
      req.session.tokens = null;
      return res.status(401).json({ error: 'Google session expired', message: 'Your Google session has expired. Please reconnect your account.', reauth: true });
    }
    const detail = getGoogleErrorDetail(err);
    res.status(err.code || 500).json({ error: 'Failed to fetch contacts', message: detail });
  }
});

export default router;
