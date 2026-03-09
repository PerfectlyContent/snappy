import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

import authRoutes from './routes/auth.js';
import classifyRoutes from './routes/classify.js';
import calendarRoutes from './routes/calendar.js';
import driveRoutes from './routes/drive.js';
import contactsRoutes from './routes/contacts.js';
import shareRoutes from './routes/share.js';
import snapRoutes from './routes/snap.js';
import healthRoutes from './routes/health.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy in production (Render, Railway, etc.)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'snappy-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax',
  },
}));

// Serve static client build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../client/dist')));
}

// Routes
app.use('/auth', authRoutes);
app.use('/classify', classifyRoutes);
app.use('/calendar', calendarRoutes);
app.use('/drive', driveRoutes);
app.use('/contacts', contactsRoutes);
app.use('/share', shareRoutes);
app.use('/snap', snapRoutes);
app.use('/health', healthRoutes);

// SPA fallback in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Snappy server running on port ${PORT}`);
});
