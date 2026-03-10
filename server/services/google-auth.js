import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(oauth2Client) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export function getAuthenticatedClient(session) {
  if (!session.tokens) return null;
  const client = createOAuth2Client();
  client.setCredentials(session.tokens);

  client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      session.tokens.refresh_token = tokens.refresh_token;
    }
    session.tokens.access_token = tokens.access_token;
    session.tokens.expiry_date = tokens.expiry_date;
  });

  return client;
}

export { SCOPES };
