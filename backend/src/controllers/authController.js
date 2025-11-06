import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import * as msal from '@azure/msal-node';
import fetch from 'node-fetch';

function signToken(user, provider = 'local') {
  return jwt.sign({ id: user._id, role: user.role, name: user.name, provider }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

export async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    // Block student creation via password-based registration
    if (!role || role === 'student') {
      res.status(400);
      throw new Error('Students must sign in with Microsoft');
    }
    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Missing required fields');
    }
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400);
      throw new Error('Email already in use');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role, authProvider: 'local' });
    const token = signToken(user, 'local');
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401);
      throw new Error('Invalid credentials');
    }
    // Students cannot use password login
    if (user.role === 'student') {
      res.status(401);
      throw new Error('Students must sign in with Microsoft');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(401);
      throw new Error('Invalid credentials');
    }
    const token = signToken(user, 'local');
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

// ================= Microsoft OAuth (Entra ID) =================
const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
    clientSecret: process.env.CLIENT_SECRET,
  },
};
let cca;
function getMsalApp() {
  if (!cca) {
    if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.TENANT_ID || !process.env.REDIRECT_URI) {
      throw new Error('Missing Azure OAuth configuration');
    }
    cca = new msal.ConfidentialClientApplication(msalConfig);
  }
  return cca;
}

const MS_SCOPES = [ 'User.Read' ];

export async function microsoftAuth(req, res, next) {
  try {
    const app = getMsalApp();
    const authCodeUrlParameters = {
      scopes: MS_SCOPES,
      redirectUri: process.env.REDIRECT_URI,
      responseMode: 'query',
    };
    const authUrl = await app.getAuthCodeUrl(authCodeUrlParameters);
    return res.redirect(authUrl);
  } catch (err) {
    next(err);
  }
}

function isDomainAllowed(email) {
  const allowed = (process.env.ALLOWED_EMAIL_DOMAINS || '').split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
  if (allowed.length === 0) return true;
  const lower = (email || '').toLowerCase();
  return allowed.some((dom) => lower.endsWith(`@${dom}`));
}

export async function microsoftCallback(req, res, next) {
  try {
    const code = req.query.code;
    if (!code) {
      res.status(400);
      throw new Error('Missing code');
    }
    const app = getMsalApp();
    const tokenResponse = await app.acquireTokenByCode({ code, scopes: MS_SCOPES, redirectUri: process.env.REDIRECT_URI });
    const accessToken = tokenResponse?.accessToken;
    if (!accessToken) {
      res.status(401);
      throw new Error('OAuth token exchange failed');
    }
    // Fetch profile from Microsoft Graph
    const graphRes = await fetch('https://graph.microsoft.com/v1.0/me', { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!graphRes.ok) {
      res.status(401);
      throw new Error('Failed to fetch profile');
    }
    const profile = await graphRes.json();
    const email = profile.mail || profile.userPrincipalName; // mail may be null
    const fullName = profile.displayName || 'Student';
    const microsoftId = profile.id;

    if (!email || !isDomainAllowed(email)) {
      res.status(401);
      throw new Error('Unauthorized email domain');
    }

    // Upsert user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name: fullName, email, role: 'student', microsoftId, authProvider: 'microsoft' });
    } else {
      user.name = user.name || fullName;
      user.microsoftId = microsoftId;
      user.authProvider = 'microsoft';
      await user.save();
    }

    const token = signToken(user, 'microsoft');

    // Redirect back to client with JWT; default to first origin in CLIENT_ORIGIN
    const clientOrigin = (process.env.CLIENT_ORIGIN || 'http://localhost:3000').split(',')[0];
    const redirectUrl = `${clientOrigin}/auth/login?token=${encodeURIComponent(token)}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    next(err);
  }
}
