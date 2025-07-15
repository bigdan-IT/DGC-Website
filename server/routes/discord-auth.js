const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { db } = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Discord OAuth2 configuration
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'https://dansgaming.net/api/discord-auth/callback';
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID; // Your Discord server ID
const ALLOWED_ROLES = process.env.ALLOWED_ROLES ? process.env.ALLOWED_ROLES.split(',') : []; // Comma-separated role IDs

// Debug environment variables
console.log('Discord OAuth Config:', {
  CLIENT_ID: DISCORD_CLIENT_ID ? 'SET' : 'NOT SET',
  CLIENT_SECRET: DISCORD_CLIENT_SECRET ? 'SET' : 'NOT SET',
  REDIRECT_URI: DISCORD_REDIRECT_URI,
  GUILD_ID: DISCORD_GUILD_ID ? 'SET' : 'NOT SET',
  ALLOWED_ROLES: ALLOWED_ROLES.length > 0 ? ALLOWED_ROLES : 'NOT SET',
  BOT_TOKEN: process.env.DISCORD_BOT_TOKEN ? 'SET' : 'NOT SET'
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Get Discord OAuth URL
router.get('/login', (req, res) => {
  console.log('Discord login endpoint called');
  
  // Check if required environment variables are set
  if (!DISCORD_CLIENT_ID) {
    console.error('DISCORD_CLIENT_ID is not set');
    return res.status(500).json({ error: 'Discord client ID not configured' });
  }
  
  if (!DISCORD_REDIRECT_URI) {
    console.error('DISCORD_REDIRECT_URI is not set');
    return res.status(500).json({ error: 'Discord redirect URI not configured' });
  }
  
  const state = Math.random().toString(36).substring(7);
  
  // Store state in session or database for verification
  // For simplicity, we'll use a simple approach here
  
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds.members.read&state=${state}`;
  
  console.log('Generated Discord auth URL:', discordAuthUrl);
  
  res.json({ authUrl: discordAuthUrl, state });
});

// Discord OAuth callback
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  console.log('Discord OAuth callback received:', { code: !!code, state });

  if (!code) {
    console.log('No authorization code received');
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    console.log('Exchanging code for access token...');
    // Exchange code for access token
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: DISCORD_REDIRECT_URI
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token } = tokenResponse.data;
    console.log('Access token received');

    // Get user information
    console.log('Getting Discord user info...');
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const discordUser = userResponse.data;
    console.log('Discord user:', discordUser.username);

    // Check if we have the required environment variables for role checking
    if (DISCORD_GUILD_ID && process.env.DISCORD_BOT_TOKEN && ALLOWED_ROLES.length > 0) {
      console.log('Checking guild membership and roles...');
      try {
        // Get user's guild membership
        const guildMemberResponse = await axios.get(
          `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${discordUser.id}`,
          {
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
            }
          }
        );

        const guildMember = guildMemberResponse.data;
        const userRoles = guildMember.roles || [];

        // Check if user has any of the allowed roles
        const hasAllowedRole = userRoles.some(roleId => ALLOWED_ROLES.includes(roleId));

        if (!hasAllowedRole) {
          console.log('User does not have required roles');
          return res.redirect('/staff-login?error=access_denied');
        }
        console.log('User has required roles');
      } catch (guildError) {
        console.error('Error checking guild membership:', guildError.message);
        // For now, allow access even if role check fails
        console.log('Allowing access despite role check failure');
      }
    } else {
      console.log('Skipping role check - missing environment variables');
    }

    // Check if user exists in database, create if not
    console.log('Checking if user exists in database...');
    db.get('SELECT * FROM users WHERE discord_id = ?', [discordUser.id], (err, existingUser) => {
      if (err) {
        console.error('Database error checking user:', err);
        return res.redirect('/staff-login?error=database_error');
      }

      if (existingUser) {
        console.log('User exists, updating last login...');
        // Update existing user
        db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE discord_id = ?', [discordUser.id]);
        
        const token = jwt.sign(
          { 
            id: existingUser.id, 
            username: existingUser.username, 
            discord_id: discordUser.id,
            role: 'staff' 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        console.log('Redirecting to admin page with token for existing user');
        // Redirect to admin page with token
        res.redirect(`/admin?token=${token}`);
      } else {
        console.log('Creating new staff user...');
        // Create new staff user
        const username = discordUser.username;
        const avatar_url = discordUser.avatar 
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : null;

        db.run(
          'INSERT INTO users (username, email, role, discord_id, avatar_url) VALUES (?, ?, ?, ?, ?)',
          [username, `${username}@discord.com`, 'staff', discordUser.id, avatar_url],
          function(err) {
            if (err) {
              console.error('Error creating user:', err);
              return res.redirect('/staff-login?error=user_creation_error');
            }

            const token = jwt.sign(
              { 
                id: this.lastID, 
                username, 
                discord_id: discordUser.id,
                role: 'staff' 
              },
              JWT_SECRET,
              { expiresIn: '24h' }
            );

            console.log('Redirecting to admin page with token for new user');
            // Redirect to admin page with token
            res.redirect(`/admin?token=${token}`);
          }
        );
      }
    });

  } catch (error) {
    console.error('Discord OAuth error:', error);
    console.error('Error details:', error.response?.data || error.message);
    res.redirect('/staff-login?error=authentication_failed');
  }
});

// Verify staff token
router.get('/verify', authenticateToken, (req, res) => {
  if (req.user.role !== 'staff') {
    return res.status(403).json({ error: 'Staff access required' });
  }
  
  // Get complete user data from database
  db.get('SELECT id, username, email, role, avatar_url, discord_id FROM users WHERE id = ?', 
    [req.user.id], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    try {
      // Fetch user's Discord roles
      let discordRoles = [];
      if (user.discord_id && DISCORD_GUILD_ID && process.env.DISCORD_BOT_TOKEN) {
        try {
          const guildMemberResponse = await axios.get(
            `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${user.discord_id}`,
            {
              headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
              }
            }
          );
          discordRoles = guildMemberResponse.data.roles || [];
        } catch (roleError) {
          console.error('Error fetching Discord roles:', roleError.message);
          // Continue without roles if there's an error
        }
      }
      
      res.json({ 
        valid: true, 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
          discord_id: user.discord_id,
          discord_roles: discordRoles
        }
      });
    } catch (error) {
      console.error('Error in verify endpoint:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

module.exports = router; 