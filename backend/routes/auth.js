const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const crypto = require('crypto');
const { initializeApp, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin with just the projectId
if (!getApps().length) {
  initializeApp({ projectId: 'saregama-2dfd9' });
}

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'saregama-super-secret-key';

// Login with Firebase ID Token
router.post('/login', async (req, res) => {
  const { idToken, email: fallbackEmail, name: fallbackName } = req.body;
  
  if (!idToken) {
    return res.status(400).json({ error: 'Firebase idToken is required' });
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email || decodedToken.phone_number || fallbackEmail || `${uid}@firebase.user`;
    const name = decodedToken.name || fallbackName || email.split('@')[0];

    // Find or create user in SQLite
    const getUserStmt = db.prepare('SELECT * FROM users WHERE email = ?');
    let user = getUserStmt.get(email);

    if (!user) {
      const userId = crypto.randomUUID();
      const insertStmt = db.prepare('INSERT INTO users (id, email, name) VALUES (?, ?, ?)');
      insertStmt.run(userId, email, name);
      user = { id: userId, email, name };
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '10y' });
    res.json({ token, user });
  } catch (error) {
    console.error('Firebase Auth Error:', error);
    res.status(401).json({ error: 'Invalid Firebase token', details: error.message });
  }
});

// Get current user
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = {
  router,
  JWT_SECRET,
  authMiddleware: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
};
