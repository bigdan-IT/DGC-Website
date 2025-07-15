const express = require('express');
const { db } = require('../index');

const router = express.Router();

// Get all events
router.get('/', (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  
  db.all(`
    SELECT e.*, u.username as created_by_name
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    ORDER BY e.event_date ASC
    LIMIT ? OFFSET ?
  `, [parseInt(limit), parseInt(offset)], (err, events) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(events);
  });
});

// Get single event
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT e.*, u.username as created_by_name
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
    WHERE e.id = ?
  `, [id], (err, event) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  });
});

// Create new event (requires authentication)
router.post('/', (req, res) => {
  const { title, description, event_date, location, max_participants } = req.body;
  const created_by = req.user?.id;
  
  if (!title || !event_date) {
    return res.status(400).json({ error: 'Title and event date required' });
  }
  
  if (!created_by) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  db.run(`
    INSERT INTO events (title, description, event_date, location, max_participants, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [title, description, event_date, location, max_participants, created_by], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to create event' });
    }
    
    // Get the created event
    db.get(`
      SELECT e.*, u.username as created_by_name
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `, [this.lastID], (err, event) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to retrieve created event' });
      }
      res.status(201).json(event);
    });
  });
});

// Update event (requires authentication and ownership or admin role)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, event_date, location, max_participants } = req.body;
  const user_id = req.user?.id;
  const user_role = req.user?.role;
  
  if (!user_id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check if user owns the event or is admin
  db.get('SELECT created_by FROM events WHERE id = ?', [id], (err, event) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.created_by !== user_id && user_role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this event' });
    }
    
    // Update the event
    db.run(`
      UPDATE events 
      SET title = ?, description = ?, event_date = ?, location = ?, max_participants = ?
      WHERE id = ?
    `, [title, description, event_date, location, max_participants, id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update event' });
      }
      
      // Get the updated event
      db.get(`
        SELECT e.*, u.username as created_by_name
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        WHERE e.id = ?
      `, [id], (err, updatedEvent) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to retrieve updated event' });
        }
        res.json(updatedEvent);
      });
    });
  });
});

// Delete event (requires authentication and ownership or admin role)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const user_id = req.user?.id;
  const user_role = req.user?.role;
  
  if (!user_id) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check if user owns the event or is admin
  db.get('SELECT created_by FROM events WHERE id = ?', [id], (err, event) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.created_by !== user_id && user_role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }
    
    db.run('DELETE FROM events WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete event' });
      }
      res.json({ message: 'Event deleted successfully' });
    });
  });
});

module.exports = router; 