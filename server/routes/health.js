import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'snappy',
    timestamp: new Date().toISOString(),
    authenticated: !!req.session.tokens,
  });
});

export default router;
