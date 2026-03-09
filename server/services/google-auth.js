import { google } from 'googleapis';

const BASE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

const FEATURE_SCOPES = {
  calendar: ['https://www.googleapis.com/auth/calendar'],
  drive: ['https://www.googleapis.com/auth/drive.file'],
  contacts: ['https://www.googleapis.com/auth/contacts'],
};

const ALL_SCOPES = [
  ...BASE_SCOPES,
  ...Object.values(FEATURE_SCOPES).flat(),
];

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(oauth2Client, scopes = BASE_SCOPES, state) {
  const options = {
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
  };
  if (scopes !== BASE_SCOPES) {
    // Incremental: don't force consent for additional scopes
    // unless it's the initial login
    options.prompt = 'consent';
  } else {
    options.prompt = 'consent';
  }
  if (state) {
    options.state = state;
  }
  return oauth2Client.generateAuthUrl(options);
}

export function getScopeAuthUrl(feature, returnTo) {
  const scopes = FEATURE_SCOPES[feature];
  if (!scopes) return null;
  const client = createOAuth2Client();
  const state = JSON.stringify({ feature, returnTo });
  return getAuthUrl(client, scopes, state);
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
    if (tokens.scope) {
      session.tokens.scope = tokens.scope;
    }
  });

  return client;
}

export function hasScope(session, feature) {
  const requiredScopes = FEATURE_SCOPES[feature];
  if (!requiredScopes || !session.tokens?.scope) return false;
  const grantedScopes = session.tokens.scope.split(' ');
  return requiredScopes.every((s) => grantedScopes.includes(s));
}

export { BASE_SCOPES, FEATURE_SCOPES, ALL_SCOPES };
