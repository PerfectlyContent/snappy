import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getAuthenticatedClient } from '../services/google-auth.js';
import { createContact, getRecentContacts } from '../services/contacts.js';

const router = Router();

function isAuthError(err) {
  const code = err.code || err.response?.status;
  return code === 401 || code === 403
    || err.message?.includes('invalid_grant')
    || err.message?.includes('Token has been expired or revoked')
    || err.message?.includes('No refresh token');
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
    if (isAuthError(err)) {
      req.session.tokens = null;
      return res.status(401).json({ error: 'Google session expired', message: 'Your Google session has expired. Please reconnect your account.', reauth: true });
    }
    res.status(500).json({ error: 'Failed to create contact', message: err.message });
  }
});

router.get('/recent', requireAuth, async (req, res) => {
  try {
    const auth = getAuthenticatedClient(req.session);
    const contacts = await getRecentContacts(auth);
    res.json({ contacts });
  } catch (err) {
    console.error('Contacts fetch error:', err.message, err.code, err.response?.data || err.stack);
    if (isAuthError(err)) {
      req.session.tokens = null;
      return res.status(401).json({ error: 'Google session expired', message: 'Your Google session has expired. Please reconnect your account.', reauth: true });
    }
    res.status(500).json({ error: 'Failed to fetch contacts', message: err.message });
  }
});

export default router;
