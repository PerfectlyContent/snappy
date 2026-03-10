import { google } from 'googleapis';

export const SIGN_IN_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly';

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(oauth2Client, { scopes, includeGrantedScopes = false } = {}) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    include_granted_scopes: includeGrantedScopes,
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
