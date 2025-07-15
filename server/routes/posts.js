const express = require('express');
const { db } = require('../index');

const router = express.Router();

// Get all posts
router.get('/', (req, res) => {
  const { category, limit = 20, offset = 0 } = req.query;
  
  let query = `
    SELECT p.*, u.username as author_name, u.avatar_url as author_avatar
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
  `;
  
  const params = [];
  
  if (category) {
    query += ' WHERE p.category = ?';
    params.push(category);
  }
  
  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, posts) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(posts);
  });
});

// Get single post
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT p.*, u.username as author_name, u.avatar_url as author_avatar
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
    WHERE p.id = ?
  `, [id], (err, post) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  });
});

// Create new post (requires authentication)
router.post('/', (req, res) => {
  const { title, content, category = 'general', image_url } = req.body;
  const author_id = req.user?.id; // Will be set by auth middleware
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }
  
  if (!author_id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  db.run(`
    INSERT INTO posts (title, content, author_id, category, image_url)
    VALUES (?, ?, ?, ?, ?)
  `, [title, content, author_id, category, image_url], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to create post' });
    }
    
    // Get the created post
    db.get(`
      SELECT p.*, u.username as author_name, u.avatar_url as author_avatar
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `, [this.lastID], (err, post) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to retrieve created post' });
      }
      res.status(201).json(post);
    });
  });
});

// Update post (requires authentication and ownership or admin role)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, category, image_url } = req.body;
  const user_id = req.user?.id;
  const user_role = req.user?.role;
  
  if (!user_id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check if user owns the post or is admin
  db.get('SELECT author_id FROM posts WHERE id = ?', [id], (err, post) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (post.author_id !== user_id && user_role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }
    
    // Update the post
    db.run(`
      UPDATE posts 
      SET title = ?, content = ?, category = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title, content, category, image_url, id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update post' });
      }
      
      // Get the updated post
      db.get(`
        SELECT p.*, u.username as author_name, u.avatar_url as author_avatar
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.id = ?
      `, [id], (err, updatedPost) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to retrieve updated post' });
        }
        res.json(updatedPost);
      });
    });
  });
});

// Delete post (requires authentication and ownership or admin role)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const user_id = req.user?.id;
  const user_role = req.user?.role;
  
  if (!user_id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check if user owns the post or is admin
  db.get('SELECT author_id FROM posts WHERE id = ?', [id], (err, post) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (post.author_id !== user_id && user_role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }
    
    db.run('DELETE FROM posts WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete post' });
      }
      res.json({ message: 'Post deleted successfully' });
    });
  });
});

module.exports = router; 