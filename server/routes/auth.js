import { Router } from 'express';
import { google } from 'googleapis';
import { createOAuth2Client, getAuthUrl } from '../services/google-auth.js';

const router = Router();

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

    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data: profile } = await oauth2.userinfo.get();
    req.session.user = {
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    };

    res.redirect(`${process.env.FRONTEND_URL}?auth=success`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL}?auth=error`);
  }
});

router.get('/status', (req, res) => {
  res.json({
    authenticated: !!req.session.tokens,
    user: req.session.user || null,
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

export default router;
