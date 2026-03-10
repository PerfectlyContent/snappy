import { Router } from 'express';
import { google } from 'googleapis';
import { createOAuth2Client, getAuthUrl } from '../services/google-auth.js';
import { getAppleAuthUrl, verifyAppleToken } from '../services/apple-auth.js';

const router = Router();

// ── Google OAuth ──────────────────────────────────────────────

router.get('/google', (req, res) => {
  const client = createOAuth2Client();
  const url = getAuthUrl(client);
  res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}?auth=error`);
  }

  try {
    const client = createOAuth2Client();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    req.session.tokens = tokens;
    req.session.provider = 'google';

    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data: profile } = await oauth2.userinfo.get();
    req.session.user = {
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    };

    res.redirect(`${process.env.FRONTEND_URL}?auth=success`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}?auth=error`);
  }
});

// ── Apple Sign In ─────────────────────────────────────────────

router.get('/apple', (req, res) => {
  if (!process.env.APPLE_CLIENT_ID) {
    return res.redirect(`${process.env.FRONTEND_URL}?auth=error`);
  }
  const url = getAppleAuthUrl();
  res.redirect(url);
});

// Apple uses form_post, so body comes as URL-encoded POST
router.post('/apple/callback', async (req, res) => {
  const { code, user: userJson } = req.body;
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}?auth=error`);
  }

  try {
    const { tokens, idToken } = await verifyAppleToken(code);
    req.session.appleTokens = tokens;
    req.session.provider = 'apple';

    // Apple only sends user info on the FIRST authorization
    let name = 'Apple User';
    let email = idToken.email || '';
    if (userJson) {
      try {
        const parsed = typeof userJson === 'string' ? JSON.parse(userJson) : userJson;
        if (parsed.name) {
          name = [parsed.name.firstName, parsed.name.lastName].filter(Boolean).join(' ');
        }
        if (parsed.email) email = parsed.email;
      } catch { /* ignore parse errors */ }
    }

    req.session.user = { email, name, picture: null };
    req.session.tokens = req.session.tokens || null; // no Google tokens

    res.redirect(`${process.env.FRONTEND_URL}?auth=success`);
  } catch (err) {
    console.error('Apple Sign In callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}?auth=error`);
  }
});

router.get('/status', (req, res) => {
  const authenticated = !!(req.session.tokens || req.session.appleTokens);
  res.json({
    authenticated,
    provider: req.session.provider || null,
    user: req.session.user || null,
    appleEnabled: !!process.env.APPLE_CLIENT_ID,
  });
});

router.post('/logout', (req, res) => {
  req.session = null;
  res.clearCookie('snappy_session');
  res.json({ success: true });
});

export default router;
