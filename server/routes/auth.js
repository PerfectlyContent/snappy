import { Router } from 'express';
import { google } from 'googleapis';
import { createOAuth2Client, getAuthUrl, getScopeAuthUrl, hasScope } from '../services/google-auth.js';

const router = Router();

router.get('/google', (req, res) => {
  const client = createOAuth2Client();
  const url = getAuthUrl(client);
  res.redirect(url);
});

// Incremental scope request — redirects to Google for a specific feature's scopes
router.get('/google/scope/:feature', (req, res) => {
  const { feature } = req.params;
  const returnTo = req.query.returnTo || '/';
  const url = getScopeAuthUrl(feature, returnTo);
  if (!url) {
    return res.status(400).json({ error: 'Unknown feature' });
  }
  res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}?auth=error`);
  }

  try {
    const client = createOAuth2Client();
    const { tokens } = await client.getToken(code);

    // Merge tokens: keep existing refresh_token if the new response doesn't include one
    if (req.session.tokens) {
      const merged = { ...req.session.tokens, ...tokens };
      if (!tokens.refresh_token && req.session.tokens.refresh_token) {
        merged.refresh_token = req.session.tokens.refresh_token;
      }
      // Merge scopes from existing + new
      const existingScopes = (req.session.tokens.scope || '').split(' ').filter(Boolean);
      const newScopes = (tokens.scope || '').split(' ').filter(Boolean);
      const allScopes = [...new Set([...existingScopes, ...newScopes])];
      merged.scope = allScopes.join(' ');
      req.session.tokens = merged;
    } else {
      req.session.tokens = tokens;
    }

    client.setCredentials(req.session.tokens);

    // Fetch user profile if not already stored
    if (!req.session.user) {
      const oauth2 = google.oauth2({ version: 'v2', auth: client });
      const { data: profile } = await oauth2.userinfo.get();
      req.session.user = {
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
      };
    }

    // If this was an incremental scope request, redirect back to the feature
    if (state) {
      try {
        const parsed = JSON.parse(state);
        if (parsed.returnTo) {
          return res.redirect(`${process.env.FRONTEND_URL}${parsed.returnTo}?scope_granted=${parsed.feature}`);
        }
      } catch {
        // ignore bad state
      }
    }

    res.redirect(`${process.env.FRONTEND_URL}?auth=success`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}?auth=error`);
  }
});

router.get('/status', (req, res) => {
  const scopes = req.session.tokens?.scope?.split(' ').filter(Boolean) || [];
  res.json({
    authenticated: !!req.session.tokens,
    user: req.session.user || null,
    scopes,
    grants: {
      calendar: hasScope(req.session, 'calendar'),
      drive: hasScope(req.session, 'drive'),
      contacts: hasScope(req.session, 'contacts'),
    },
  });
});

router.post('/logout', (req, res) => {
  req.session = null;
  res.clearCookie('snappy_session');
  res.json({ success: true });
});

export default router;
