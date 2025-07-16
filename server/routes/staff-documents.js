const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { db } = require('../database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get all documents (filtered by user's access level)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Get user's Discord roles from database and Discord API
    let userLevel = 0;
    if (user.discord_id && process.env.DISCORD_GUILD_ID && process.env.DISCORD_BOT_TOKEN) {
      try {
        const guildMemberResponse = await axios.get(
          `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${user.discord_id}`,
          {
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
            }
          }
        );
        
        const discordRoles = guildMemberResponse.data.roles || [];
        const roleLevels = {
          '1394520034700693534': 3, // Founder
          '765079181666156545': 2,  // Management
          '885301651538329651': 1   // Admin
        };
        
        discordRoles.forEach(roleId => {
          const level = roleLevels[roleId];
          if (level && level > userLevel) {
            userLevel = level;
          }
        });
      } catch (roleError) {
        console.error('Error fetching Discord roles:', roleError.message);
        // Continue without roles if there's an error
      }
    }

    // Map user level to access level string
    let accessLevel = 'Admin';
    if (userLevel >= 3) accessLevel = 'Founder';
    else if (userLevel >= 2) accessLevel = 'Management';

    // Get documents user has access to
    const documents = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          id, title, content, category, access_level, author_name,
          created_at, updated_at, is_published
        FROM staff_documents 
        WHERE is_published = 1 
        AND (
          access_level = 'Admin' 
          OR (access_level = 'Management' AND ? >= 2)
          OR (access_level = 'Founder' AND ? >= 3)
        )
        ORDER BY category, title
      `, [userLevel, userLevel], (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get a single document by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Get user's permission level
    let userLevel = 0;
    if (user.discord_roles) {
      const roleLevels = {
        '1394520034700693534': 3, // Founder
        '765079181666156545': 2,  // Management
        '885301651538329651': 1   // Admin
      };
      
      user.discord_roles.forEach(roleId => {
        const level = roleLevels[roleId];
        if (level && level > userLevel) {
          userLevel = level;
        }
      });
    }

    const document = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          id, title, content, category, access_level, author_name,
          created_at, updated_at, is_published
        FROM staff_documents 
        WHERE id = ? AND is_published = 1
      `, [id], (err, row) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check access level
    const accessLevels = { 'Admin': 1, 'Management': 2, 'Founder': 3 };
    const requiredLevel = accessLevels[document.access_level] || 1;
    
    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: 'Insufficient permissions to view this document' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Create a new document (Management+ only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Get user's Discord roles from database and Discord API
    let userLevel = 0;
    if (user.discord_id && process.env.DISCORD_GUILD_ID && process.env.DISCORD_BOT_TOKEN) {
      try {
        const axios = require('axios');
        const guildMemberResponse = await axios.get(
          `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${user.discord_id}`,
          {
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
            }
          }
        );
        
        const discordRoles = guildMemberResponse.data.roles || [];
        const roleLevels = {
          '1394520034700693534': 3, // Founder
          '765079181666156545': 2,  // Management
          '885301651538329651': 1   // Admin
        };
        
        discordRoles.forEach(roleId => {
          const level = roleLevels[roleId];
          if (level && level > userLevel) {
            userLevel = level;
          }
        });
      } catch (roleError) {
        console.error('Error fetching Discord roles:', roleError.message);
        // Continue without roles if there's an error
      }
    }

    if (userLevel < 2) {
      return res.status(403).json({ error: 'Management level or higher required to create documents' });
    }

    const { title, content, category, access_level } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Validate access level
    const validAccessLevels = ['Admin', 'Management', 'Founder'];
    if (access_level && !validAccessLevels.includes(access_level)) {
      return res.status(400).json({ error: 'Invalid access level' });
    }

    // Set default access level based on user's level
    let defaultAccessLevel = 'Admin';
    if (userLevel >= 3) defaultAccessLevel = 'Founder';
    else if (userLevel >= 2) defaultAccessLevel = 'Management';

    const finalAccessLevel = access_level || defaultAccessLevel;

    const result = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO staff_documents (title, content, category, access_level, author_id, author_name)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        title,
        content,
        category || 'general',
        finalAccessLevel,
        user.discord_id || user.id,
        user.username || 'Unknown'
      ], function(err) {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          resolve(this);
        }
      });
    });

    res.json({ 
      success: true, 
      message: 'Document created successfully',
      documentId: result.lastID
    });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// Update a document (Management+ only, or author)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { title, content, category, access_level, is_published } = req.body;
    
    // Get user's Discord roles from database and Discord API
    let userLevel = 0;
    if (user.discord_id && process.env.DISCORD_GUILD_ID && process.env.DISCORD_BOT_TOKEN) {
      try {
        const guildMemberResponse = await axios.get(
          `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${user.discord_id}`,
          {
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
            }
          }
        );
        
        const discordRoles = guildMemberResponse.data.roles || [];
        const roleLevels = {
          '1394520034700693534': 3, // Founder
          '765079181666156545': 2,  // Management
          '885301651538329651': 1   // Admin
        };
        
        discordRoles.forEach(roleId => {
          const level = roleLevels[roleId];
          if (level && level > userLevel) {
            userLevel = level;
          }
        });
      } catch (roleError) {
        console.error('Error fetching Discord roles:', roleError.message);
        // Continue without roles if there's an error
      }
    }

    // Get the document to check permissions
    const document = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM staff_documents WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if user can edit (Management+ or author)
    const isAuthor = document.author_id === (user.discord_id || user.id);
    if (userLevel < 2 && !isAuthor) {
      return res.status(403).json({ error: 'Insufficient permissions to edit this document' });
    }

    // Validate access level if being changed
    if (access_level) {
      const validAccessLevels = ['Admin', 'Management', 'Founder'];
      if (!validAccessLevels.includes(access_level)) {
        return res.status(400).json({ error: 'Invalid access level' });
      }
      
      // Only Management+ can change access levels
      if (userLevel < 2) {
        return res.status(403).json({ error: 'Management level or higher required to change access levels' });
      }
    }

    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE staff_documents 
        SET title = ?, content = ?, category = ?, access_level = ?, 
            updated_at = CURRENT_TIMESTAMP, is_published = ?
        WHERE id = ?
      `, [
        title || document.title,
        content || document.content,
        category || document.category,
        access_level || document.access_level,
        is_published !== undefined ? is_published : document.is_published,
        id
      ], function(err) {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          resolve(this);
        }
      });
    });

    res.json({ 
      success: true, 
      message: 'Document updated successfully'
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Delete a document (Management+ only, or author)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Get user's Discord roles from database and Discord API
    let userLevel = 0;
    if (user.discord_id && process.env.DISCORD_GUILD_ID && process.env.DISCORD_BOT_TOKEN) {
      try {
        const guildMemberResponse = await axios.get(
          `https://discord.com/api/guilds/${process.env.DISCORD_GUILD_ID}/members/${user.discord_id}`,
          {
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
            }
          }
        );
        
        const discordRoles = guildMemberResponse.data.roles || [];
        const roleLevels = {
          '1394520034700693534': 3, // Founder
          '765079181666156545': 2,  // Management
          '885301651538329651': 1   // Admin
        };
        
        discordRoles.forEach(roleId => {
          const level = roleLevels[roleId];
          if (level && level > userLevel) {
            userLevel = level;
          }
        });
      } catch (roleError) {
        console.error('Error fetching Discord roles:', roleError.message);
        // Continue without roles if there's an error
      }
    }

    // Get the document to check permissions
    const document = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM staff_documents WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if user can delete (Management+ or author)
    const isAuthor = document.author_id === (user.discord_id || user.id);
    if (userLevel < 2 && !isAuthor) {
      return res.status(403).json({ error: 'Insufficient permissions to delete this document' });
    }

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM staff_documents WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          resolve(this);
        }
      });
    });

    res.json({ 
      success: true, 
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Get document categories
router.get('/categories/list', authenticateToken, async (req, res) => {
  try {
    const categories = await new Promise((resolve, reject) => {
      db.all(`
        SELECT DISTINCT category 
        FROM staff_documents 
        WHERE is_published = 1 
        ORDER BY category
      `, [], (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });

    const categoryList = categories.map(row => row.category);
    res.json(categoryList);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router; 