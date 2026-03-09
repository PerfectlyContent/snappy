import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { getAuthenticatedClient } from '../services/google-auth.js';
import { uploadFile, listFolders } from '../services/drive.js';

const router = Router();

function isAuthError(err) {
  const code = err.code || err.response?.status;
  return code === 401 || code === 403
    || err.message?.includes('invalid_grant')
    || err.message?.includes('Token has been expired or revoked')
    || err.message?.includes('No refresh token');
}

router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const auth = getAuthenticatedClient(req.session);
    let buffer, mimeType, fileName;

    if (req.file) {
      buffer = req.file.buffer;
      mimeType = req.file.mimetype;
      fileName = req.body.fileName || req.file.originalname;
    } else if (req.body.image) {
      const match = req.body.image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        buffer = Buffer.from(match[2], 'base64');
      } else {
        buffer = Buffer.from(req.body.image, 'base64');
        mimeType = req.body.mimeType || 'image/png';
      }
      fileName = req.body.fileName;
    } else {
      return res.status(400).json({ error: 'No file provided' });
    }

    const classificationType = req.body.classificationType || 'document';
    const result = await uploadFile(auth, { buffer, mimeType, fileName, classificationType });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Drive upload error:', err.message, err.code, err.response?.data || err.stack);
    if (isAuthError(err)) {
      req.session.tokens = null;
      return res.status(401).json({ error: 'Google session expired', message: 'Your Google session has expired. Please reconnect your account.', reauth: true });
    }
    res.status(500).json({ error: 'Failed to upload file', message: err.message });
  }
});

router.get('/folders', requireAuth, async (req, res) => {
  try {
    const auth = getAuthenticatedClient(req.session);
    const folders = await listFolders(auth);
    res.json({ folders });
  } catch (err) {
    console.error('Drive folders error:', err.message, err.code, err.response?.data || err.stack);
    if (isAuthError(err)) {
      req.session.tokens = null;
      return res.status(401).json({ error: 'Google session expired', message: 'Your Google session has expired. Please reconnect your account.', reauth: true });
    }
    res.status(500).json({ error: 'Failed to list folders', message: err.message });
  }
});

export default router;
