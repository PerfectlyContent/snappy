import appleSignin from 'apple-signin-auth';

export function getAppleAuthUrl() {
  return appleSignin.getAuthorizationUrl({
    clientID: process.env.APPLE_CLIENT_ID,
    redirectUri: process.env.APPLE_REDIRECT_URI,
    scope: 'name email',
    responseMode: 'form_post',
    state: 'snappy-apple-auth',
  });
}

export async function verifyAppleToken(code) {
  const clientSecret = appleSignin.getClientSecret({
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    keyIdentifier: process.env.APPLE_KEY_ID,
    privateKey: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  });

  const tokens = await appleSignin.getAuthorizationToken(code, {
    clientID: process.env.APPLE_CLIENT_ID,
    clientSecret,
    redirectUri: process.env.APPLE_REDIRECT_URI,
  });

  const idToken = await appleSignin.verifyIdToken(tokens.id_token, {
    audience: process.env.APPLE_CLIENT_ID,
  });

  return { tokens, idToken };
}
