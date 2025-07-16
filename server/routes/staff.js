const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { db } = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Discord configuration
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Role mappings
const ROLE_MAPPINGS = {
  '1394520034700693534': 'Founder',
  '765079181666156545': 'Management',
  '885301651538329651': 'Admin'
};

// Reverse role mappings for display
const ROLE_NAMES_TO_IDS = {
  'Founder': '1394520034700693534',
  'Management': '765079181666156545',
  'Admin': '885301651538329651'
};

// Retired role ID
const RETIRED_ROLE_ID = '761356380363816961';

// Cache for guild members (5 minutes)
let guildMembersCache = null;
let guildMembersCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limiting utility with better backoff
const makeDiscordRequest = async (url, options = {}, maxRetries = 3) => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          ...options.headers
        },
        ...options
      });
      return response;
    } catch (error) {
      if (error.response?.status === 429 && attempt < maxRetries) {
        const retryAfter = error.response.headers['retry-after'] || 1;
        const waitTime = parseInt(retryAfter) * 1000; // Convert to milliseconds
        
        console.log(`Rate limited. Waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If it's not a rate limit error or we've exhausted retries, throw the error
      throw error;
    }
  }
};

// Fetch all guild members with caching and rate limiting
const fetchAllGuildMembers = async () => {
  // Check if we have valid cached data
  const now = Date.now();
  if (guildMembersCache && (now - guildMembersCacheTime) < CACHE_DURATION) {
    console.log('Using cached guild members data');
    return guildMembersCache;
  }

  console.log('Fetching fresh guild members data...');
  
  // Fetch all guild members with pagination and rate limiting
  let allGuildMembers = [];
  let after = null;
  let hasMore = true;
  let requestCount = 0;
  
  while (hasMore) {
    const url = `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members?limit=1000${after ? `&after=${after}` : ''}`;
    
    try {
      const guildMembersResponse = await makeDiscordRequest(url);
      const guildMembers = guildMembersResponse.data;
      allGuildMembers = allGuildMembers.concat(guildMembers);
      requestCount++;
      
      console.log(`Fetched ${guildMembers.length} members, total so far: ${allGuildMembers.length}`);
      
      // Check if we have more members to fetch
      if (guildMembers.length < 1000) {
        hasMore = false;
      } else {
        // Set the 'after' parameter for the next request
        after = guildMembers[guildMembers.length - 1].user.id;
        
        // Add a small delay between requests to avoid rate limiting
        if (requestCount > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Error fetching guild members:', error);
      throw error;
    }
  }

  // Cache the results
  guildMembersCache = allGuildMembers;
  guildMembersCacheTime = now;
  
  console.log(`Cached ${allGuildMembers.length} guild members`);
  return allGuildMembers;
};

// Clear cache (useful for testing or when data becomes stale)
const clearGuildMembersCache = () => {
  guildMembersCache = null;
  guildMembersCacheTime = 0;
  console.log('Guild members cache cleared');
};

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

// Get all guild members with their roles
router.get('/roster', authenticateToken, async (req, res) => {
  try {
    if (!DISCORD_GUILD_ID || !DISCORD_BOT_TOKEN) {
      return res.status(500).json({ error: 'Discord configuration missing' });
    }

    // Use cached guild members data
    const guildMembers = await fetchAllGuildMembers();
    const activeStaff = [];

    // Process each member with proper async handling
    const processMembers = async () => {
      console.log(`Processing ${guildMembers.length} guild members`);
      console.log('Role mappings:', ROLE_MAPPINGS);
      
      for (const member of guildMembers) {
        const userRoles = member.roles || [];
        console.log(`Member ${member.user.username} (${member.user.id}) has roles:`, userRoles);
        
        // Check if user has any staff role
        const staffRole = userRoles.find(roleId => ROLE_MAPPINGS[roleId]);
        
        if (staffRole) {
          const roleName = ROLE_MAPPINGS[staffRole];
          console.log(`Found staff member: ${member.user.username} with role ${roleName}`);
          
          // Get user info from database if exists
          const dbUser = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE discord_id = ?', [member.user.id], (err, user) => {
              if (err) {
                console.error('Database error:', err);
                resolve(null);
              } else {
                resolve(user);
              }
            });
          });
          
          const staffMember = {
            id: member.user.id,
            username: member.user.username,
            displayName: member.nick || member.user.username,
            rank: roleName,
            playfabId: dbUser?.playfab_id || '',
            recruitmentDate: dbUser?.recruitment_date || null,
            status: dbUser?.status || 'Active',
            isActive: true,
            avatar: member.user.avatar 
              ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`
              : null
          };
          
          activeStaff.push(staffMember);
        }
      }

      // Sort by role hierarchy (Founder > Management > Admin)
      const roleHierarchy = { 'Founder': 1, 'Management': 2, 'Admin': 3 };
      activeStaff.sort((a, b) => roleHierarchy[a.rank] - roleHierarchy[b.rank]);

      console.log(`Total active staff found: ${activeStaff.length}`);
      
      // Check if past_staff table exists
      const tableExists = await new Promise((resolve, reject) => {
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='past_staff'", (err, row) => {
          if (err) {
            console.error('Error checking if past_staff table exists:', err);
            resolve(false);
          } else {
            console.log('past_staff table exists:', !!row);
            resolve(!!row);
          }
        });
      });

      // Load past staff from database
      console.log('Loading past staff from database...');
      const pastStaff = await new Promise((resolve, reject) => {
        db.all(`
          SELECT 
            discord_id as id,
            username,
            display_name as name,
            rank,
            playfab_id as playfabID,
            recruitment_date as recruitmentDate,
            removal_date as removalDate,
            removal_reason as removalReason
          FROM past_staff 
          ORDER BY removal_date DESC
        `, [], (err, rows) => {
          if (err) {
            console.error('Error loading past staff:', err);
            resolve([]);
          } else {
            console.log('Past staff query result:', rows);
            resolve(rows || []);
          }
        });
      });

      console.log(`Total past staff found: ${pastStaff.length}`);
      console.log('Past staff data:', pastStaff);
      
      res.json({ 
        activeStaff,
        pastStaff
      });
    };

    await processMembers();

  } catch (error) {
    console.error('Error fetching guild members:', error);
    
    // Check if it's a permission error
    if (error.response?.status === 403) {
      console.error('Discord bot lacks permissions. Please ensure:');
      console.error('1. Server Members Intent is enabled in Discord Developer Portal');
      console.error('2. Bot has "View Server Members" permission');
      console.error('3. Bot has been added to the server with proper permissions');
      
      // Return fallback data for testing
      console.log('Returning fallback data due to Discord permissions error');
      
      // Check if past_staff table exists for fallback
      const tableExists = await new Promise((resolve, reject) => {
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='past_staff'", (err, row) => {
          if (err) {
            console.error('Error checking if past_staff table exists:', err);
            resolve(false);
          } else {
            console.log('past_staff table exists (fallback):', !!row);
            resolve(!!row);
          }
        });
      });

      // Load past staff from database for fallback
      const pastStaff = await new Promise((resolve, reject) => {
        db.all(`
          SELECT 
            discord_id as id,
            username,
            display_name as name,
            rank,
            playfab_id as playfabID,
            recruitment_date as recruitmentDate,
            removal_date as removalDate,
            removal_reason as removalReason
          FROM past_staff 
          ORDER BY removal_date DESC
        `, [], (err, rows) => {
          if (err) {
            console.error('Error loading past staff:', err);
            resolve([]);
          } else {
            console.log('Past staff query result (fallback):', rows);
            resolve(rows || []);
          }
        });
      });
      
      return res.json({ 
        activeStaff: [
          {
            id: '1394520034700693534',
            username: 'BigDan',
            displayName: 'BigDan',
            rank: 'Founder',
            playfabId: '',
            steam64Id: '',
            recruitmentDate: null,
            isActive: true,
            avatar: null
          }
        ],
        pastStaff
      });
    }
    
    // Check if it's a rate limit error
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      return res.status(429).json({ 
        error: 'Discord API rate limit exceeded',
        retryAfter: parseInt(retryAfter),
        message: `Please wait ${retryAfter} seconds before trying again`
      });
    }
    
    res.status(500).json({ error: 'Failed to fetch staff roster' });
  }
});

// Get all server roles for debugging
router.get('/server-roles', authenticateToken, async (req, res) => {
  try {
    if (!DISCORD_GUILD_ID || !DISCORD_BOT_TOKEN) {
      return res.status(500).json({ error: 'Discord configuration missing' });
    }

    // Fetch all server roles
    const rolesResponse = await makeDiscordRequest(
      `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/roles`
    );

    const roles = rolesResponse.data;
    console.log('All server roles:', roles.map(r => ({ id: r.id, name: r.name, color: r.color })));

    res.json({ 
      roles: roles.map(r => ({ id: r.id, name: r.name, color: r.color })),
      currentMappings: ROLE_MAPPINGS
    });

  } catch (error) {
    console.error('Error fetching server roles:', error);
    
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      return res.status(429).json({ 
        error: 'Discord API rate limit exceeded',
        retryAfter: parseInt(retryAfter),
        message: `Please wait ${retryAfter} seconds before trying again`
      });
    }
    
    res.status(500).json({ error: 'Failed to fetch server roles' });
  }
});

// Search guild members (excluding current staff)
router.get('/search-members', authenticateToken, async (req, res) => {
  try {
    if (!DISCORD_GUILD_ID || !DISCORD_BOT_TOKEN) {
      return res.status(500).json({ error: 'Discord configuration missing' });
    }

    const { query } = req.query;
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    // Use cached guild members data
    const guildMembers = await fetchAllGuildMembers();
    const searchResults = [];

    // Filter members based on search query and exclude current staff
    for (const member of guildMembers) {
      const userRoles = member.roles || [];
      const hasStaffRole = userRoles.some(roleId => ROLE_MAPPINGS[roleId]);
      
      // Skip if user already has a staff role
      if (hasStaffRole) continue;

      const displayName = member.nick || member.user.username;
      const username = member.user.username;
      
      // Search in display name, username, and user ID
      if (displayName.toLowerCase().includes(query.toLowerCase()) ||
          username.toLowerCase().includes(query.toLowerCase()) ||
          member.user.id.includes(query)) {
        
        searchResults.push({
          id: member.user.id,
          username: username,
          displayName: displayName,
          avatar: member.user.avatar 
            ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`
            : null
        });
      }
    }

    // Limit results to 20
    res.json({ members: searchResults.slice(0, 20) });

  } catch (error) {
    console.error('Error searching guild members:', error);
    
    if (error.response?.status === 403) {
      return res.status(500).json({ 
        error: 'Discord bot permissions error. Please check bot configuration.',
        details: 'Bot needs Server Members Intent and View Server Members permission'
      });
    }
    
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      return res.status(429).json({ 
        error: 'Discord API rate limit exceeded',
        retryAfter: parseInt(retryAfter),
        message: `Please wait ${retryAfter} seconds before trying again. Try refreshing the page to use cached data.`
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to search guild members',
      message: 'The search is temporarily unavailable. Please try again in a few minutes.'
    });
  }
});

// Debug endpoint to see all guild members and their roles
router.get('/debug-members', authenticateToken, async (req, res) => {
  try {
    if (!DISCORD_GUILD_ID || !DISCORD_BOT_TOKEN) {
      return res.status(500).json({ error: 'Discord configuration missing' });
    }

    // Use cached guild members data
    const guildMembers = await fetchAllGuildMembers();
    const membersWithRoles = guildMembers.map(member => ({
      id: member.user.id,
      username: member.user.username,
      displayName: member.nick || member.user.username,
      roles: member.roles || [],
      hasStaffRole: (member.roles || []).some(roleId => ROLE_MAPPINGS[roleId])
    }));

    res.json({ 
      totalMembers: guildMembers.length,
      members: membersWithRoles,
      roleMappings: ROLE_MAPPINGS,
      cacheInfo: {
        isCached: guildMembersCache !== null,
        cacheAge: guildMembersCacheTime ? Math.floor((Date.now() - guildMembersCacheTime) / 1000) : null
      }
    });

  } catch (error) {
    console.error('Error fetching guild members for debug:', error);
    
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      return res.status(429).json({ 
        error: 'Discord API rate limit exceeded',
        retryAfter: parseInt(retryAfter),
        message: `Please wait ${retryAfter} seconds before trying again`
      });
    }
    
    res.status(500).json({ error: 'Failed to fetch guild members' });
  }
});

// Clear cache endpoint (for admin use)
router.post('/clear-cache', authenticateToken, async (req, res) => {
  try {
    clearGuildMembersCache();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Add role to user
router.post('/add-role', authenticateToken, async (req, res) => {
  try {
    if (!DISCORD_GUILD_ID || !DISCORD_BOT_TOKEN) {
      return res.status(500).json({ error: 'Discord configuration missing' });
    }

    const { userId, roleName } = req.body;
    
    if (!userId || !roleName) {
      return res.status(400).json({ error: 'User ID and role name are required' });
    }

    const roleId = ROLE_NAMES_TO_IDS[roleName];
    if (!roleId) {
      return res.status(400).json({ error: 'Invalid role name' });
    }

    // Remove Retired role first (if they have it)
    try {
      await axios.delete(
        `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${userId}/roles/${RETIRED_ROLE_ID}`,
        {
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`
          }
        }
      );
      console.log(`Removed Retired role from user ${userId}`);
    } catch (retiredRoleError) {
      // Don't fail if they don't have the Retired role
      console.log(`User ${userId} doesn't have Retired role or error removing it:`, retiredRoleError.message);
    }

    // Add staff role to user
    await axios.put(
      `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${userId}/roles/${roleId}`,
      {},
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`
        }
      }
    );

    // Get updated user info
    const guildMemberResponse = await makeDiscordRequest(
      `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${userId}`
    );

    const member = guildMemberResponse.data;
    
    // Get user info from database if exists
    const dbUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE discord_id = ?', [userId], (err, user) => {
        if (err) {
          console.error('Database error:', err);
          resolve(null);
        } else {
          resolve(user);
        }
      });
    });

    const staffMember = {
      id: member.user.id,
      username: member.user.username,
      displayName: member.nick || member.user.username,
      rank: roleName,
      playfabId: dbUser?.playfab_id || '',
      recruitmentDate: dbUser?.recruitment_date || null,
      isActive: true,
      avatar: member.user.avatar 
        ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`
        : null
    };

    res.json({ 
      success: true, 
      message: `Successfully added ${roleName} role to ${staffMember.displayName} and removed Retired role`,
      staffMember 
    });

  } catch (error) {
    console.error('Error adding role:', error);
    
    if (error.response?.status === 403) {
      return res.status(500).json({ 
        error: 'Discord bot permissions error. Bot needs Manage Roles permission.',
        details: 'Make sure the bot has the "Manage Roles" permission and is above the role it\'s trying to manage'
      });
    }
    
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      return res.status(429).json({ 
        error: 'Discord API rate limit exceeded',
        retryAfter: parseInt(retryAfter),
        message: `Please wait ${retryAfter} seconds before trying again`
      });
    }
    
    res.status(500).json({ error: 'Failed to add role' });
  }
});

// Remove role from user
router.delete('/remove-role', authenticateToken, async (req, res) => {
  try {
    if (!DISCORD_GUILD_ID || !DISCORD_BOT_TOKEN) {
      return res.status(500).json({ error: 'Discord configuration missing' });
    }

    const { userId, roleName } = req.body;
    
    if (!userId || !roleName) {
      return res.status(400).json({ error: 'User ID and role name are required' });
    }

    const roleId = ROLE_NAMES_TO_IDS[roleName];
    if (!roleId) {
      return res.status(400).json({ error: 'Invalid role name' });
    }

    // Remove staff role from user
    await axios.delete(
      `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${userId}/roles/${roleId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`
        }
      }
    );

    // Add Retired role to user
    try {
      await axios.put(
        `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${userId}/roles/${RETIRED_ROLE_ID}`,
        {},
        {
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`
          }
        }
      );
      console.log(`Added Retired role to user ${userId}`);
    } catch (retiredRoleError) {
      console.error('Error adding Retired role:', retiredRoleError);
      // Don't fail the entire operation if adding Retired role fails
    }

    res.json({ 
      success: true, 
      message: `Successfully removed ${roleName} role from user and added Retired role`
    });

  } catch (error) {
    console.error('Error removing role:', error);
    
    if (error.response?.status === 403) {
      return res.status(500).json({ 
        error: 'Discord bot permissions error. Bot needs Manage Roles permission.',
        details: 'Make sure the bot has the "Manage Roles" permission and is above the role it\'s trying to manage'
      });
    }
    
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      return res.status(429).json({ 
        error: 'Discord API rate limit exceeded',
        retryAfter: parseInt(retryAfter),
        message: `Please wait ${retryAfter} seconds before trying again`
      });
    }
    
    res.status(500).json({ error: 'Failed to remove role' });
  }
});

// Update staff member information
router.put('/update-staff', authenticateToken, async (req, res) => {
  try {
    const { discordId, playfabId, recruitmentDate, status } = req.body;
    
    if (!discordId) {
      return res.status(400).json({ error: 'Discord ID is required' });
    }

    // Check if user exists in database
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE discord_id = ?', [discordId], (err, user) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          resolve(user);
        }
      });
    });

    if (existingUser) {
      // Update existing user
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE users SET playfab_id = ?, recruitment_date = ?, status = ? WHERE discord_id = ?',
          [playfabId || null, recruitmentDate || null, status || 'Active', discordId],
          function(err) {
            if (err) {
              console.error('Database update error:', err);
              reject(err);
            } else {
              resolve(this);
            }
          }
        );
      });
    } else {
      // For new staff members, we need to get their Discord info first
      // This should not happen in normal flow since staff members should already exist
      // But if it does, we'll create a minimal record
      console.warn('Attempting to create new user record for staff member without Discord info');
      
      // Create new user record with minimal required fields
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (username, email, role, discord_id, playfab_id, recruitment_date, status, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [`discord_${discordId}`, `discord_${discordId}@discord.com`, 'staff', discordId, playfabId || null, recruitmentDate || null, status || 'Active', null],
          function(err) {
            if (err) {
              console.error('Database insert error:', err);
              reject(err);
            } else {
              resolve(this);
            }
          }
        );
      });
    }

    res.json({ 
      success: true, 
      message: 'Staff member information updated successfully'
    });

  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({ error: 'Failed to update staff member information' });
  }
});

// Add staff member to past staff
router.post('/add-past-staff', authenticateToken, async (req, res) => {
  try {
    const { discordId, username, displayName, rank, playfabId, recruitmentDate, removalReason } = req.body;
    
    if (!discordId || !username || !displayName || !rank) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO past_staff (discord_id, username, display_name, rank, playfab_id, recruitment_date, removal_reason) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [discordId, username, displayName, rank, playfabId || null, recruitmentDate || null, removalReason || null],
        function(err) {
          if (err) {
            console.error('Database insert error:', err);
            reject(err);
          } else {
            resolve(this);
          }
        }
      );
    });

    res.json({ 
      success: true, 
      message: 'Staff member added to past staff successfully'
    });

  } catch (error) {
    console.error('Error adding past staff:', error);
    res.status(500).json({ error: 'Failed to add staff member to past staff' });
  }
});

// Update past staff member
router.put('/update-past-staff', authenticateToken, async (req, res) => {
  try {
    const { discordId, username, displayName, rank, playfabId, recruitmentDate, removalReason } = req.body;
    
    if (!discordId) {
      return res.status(400).json({ error: 'Discord ID is required' });
    }

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE past_staff 
         SET username = ?, display_name = ?, rank = ?, playfab_id = ?, recruitment_date = ?, removal_reason = ?
         WHERE discord_id = ?`,
        [username, displayName, rank, playfabId || null, recruitmentDate || null, removalReason || null, discordId],
        function(err) {
          if (err) {
            console.error('Database update error:', err);
            reject(err);
          } else {
            resolve(this);
          }
        }
      );
    });

    res.json({ 
      success: true, 
      message: 'Past staff member updated successfully'
    });

  } catch (error) {
    console.error('Error updating past staff:', error);
    res.status(500).json({ error: 'Failed to update past staff member' });
  }
});

// Remove past staff member
router.delete('/remove-past-staff', authenticateToken, async (req, res) => {
  try {
    const { discordId } = req.body;
    
    if (!discordId) {
      return res.status(400).json({ error: 'Discord ID is required' });
    }

    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM past_staff WHERE discord_id = ?',
        [discordId],
        function(err) {
          if (err) {
            console.error('Database delete error:', err);
            reject(err);
          } else {
            resolve(this);
          }
        }
      );
    });

    res.json({ 
      success: true, 
      message: 'Past staff member removed successfully'
    });

  } catch (error) {
    console.error('Error removing past staff:', error);
    res.status(500).json({ error: 'Failed to remove past staff member' });
  }
});

module.exports = router; 