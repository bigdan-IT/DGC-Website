const express = require('express');
const { db } = require('../index');

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all users (admin only)
router.get('/', requireAdmin, (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  
  db.all(`
    SELECT id, username, email, role, avatar_url, created_at, last_login
    FROM users
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [parseInt(limit), parseInt(offset)], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Get user profile
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT id, username, email, role, avatar_url, created_at, last_login
    FROM users
    WHERE id = ?
  `, [id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Update user profile (own profile or admin)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { username, email, avatar_url } = req.body;
  const user_id = req.user?.id;
  const user_role = req.user?.role;
  
  if (!user_id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (parseInt(id) !== user_id && user_role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to edit this user' });
  }
  
  db.run(`
    UPDATE users 
    SET username = ?, email = ?, avatar_url = ?
    WHERE id = ?
  `, [username, email, avatar_url, id], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      return res.status(500).json({ error: 'Failed to update user' });
    }
    
    // Get the updated user
    db.get(`
      SELECT id, username, email, role, avatar_url, created_at, last_login
      FROM users
      WHERE id = ?
    `, [id], (err, updatedUser) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to retrieve updated user' });
      }
      res.json(updatedUser);
    });
  });
});

// Update user role (admin only)
router.patch('/:id/role', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  
  if (!['user', 'admin', 'moderator'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  db.run('UPDATE users SET role = ? WHERE id = ?', [role, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update user role' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User role updated successfully' });
  });
});

// Delete user (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  
  // Don't allow admin to delete themselves
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  
  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  });
});

// Get user statistics (admin only)
router.get('/stats/overview', requireAdmin, (req, res) => {
  db.get(`
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
      COUNT(CASE WHEN role = 'moderator' THEN 1 END) as moderator_count,
      COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
      COUNT(CASE WHEN last_login > datetime('now', '-7 days') THEN 1 END) as active_this_week
    FROM users
  `, (err, stats) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(stats);
  });
});

module.exports = router; 