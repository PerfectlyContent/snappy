export function requireAuth(req, res, next) {
  if (!req.session.tokens) {
    return res.status(401).json({
      error: 'Not authenticated',
      message: 'Please connect your Google account to continue.',
    });
  }
  next();
}
