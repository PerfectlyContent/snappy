import { hasScope, getScopeAuthUrl } from '../services/google-auth.js';

export function requireAuth(req, res, next) {
  if (!req.session.tokens) {
    return res.status(401).json({
      error: 'Not authenticated',
      message: 'Please connect your Google account to continue.',
    });
  }
  next();
}

export function requireScope(feature) {
  return (req, res, next) => {
    if (!req.session.tokens) {
      return res.status(401).json({
        error: 'Not authenticated',
        message: 'Please connect your Google account to continue.',
      });
    }
    if (!hasScope(req.session, feature)) {
      return res.status(403).json({
        error: 'scope_required',
        feature,
        message: `This action requires ${feature} access. Please grant permission to continue.`,
        authUrl: `/auth/google/scope/${feature}?returnTo=${encodeURIComponent(req.headers.referer || '/')}`,
      });
    }
    next();
  };
}
