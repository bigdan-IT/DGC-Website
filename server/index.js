const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { db } = require('./database');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting behind nginx/Apache
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs (increased from 100)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests against the limit
  skipFailedRequests: false // Count failed requests against the limit
});

// More lenient rate limiting for Discord auth
const discordAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs for Discord auth (increased from 50)
  message: { error: 'Too many Discord authentication attempts. Please try again later.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // Don't count successful requests against the limit
  skipFailedRequests: false // Count failed requests against the limit
});

app.use(limiter);

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Check if users table exists and has password_hash constraint
    db.get("PRAGMA table_info(users)", (err, rows) => {
      if (err) {
        console.log('Error checking table structure:', err);
        return;
      }
      
      // Get all column info
      db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
          console.log('Error getting column info:', err);
          return;
        }
        
        const hasPasswordHash = columns.some(col => col.name === 'password_hash');
        const passwordHashNotNull = columns.find(col => col.name === 'password_hash')?.notnull === 1;
        
        if (hasPasswordHash && passwordHashNotNull) {
          console.log('Detected password_hash column with NOT NULL constraint, recreating table...');
          
          // Create new table with proper structure
          db.run(`CREATE TABLE IF NOT EXISTS users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT DEFAULT 'user',
            avatar_url TEXT,
            discord_id TEXT UNIQUE,
            password_hash TEXT,
            playfab_id TEXT,
            steam64_id TEXT,
            notes TEXT,
            recruitment_date DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
          )`, (err) => {
            if (err) {
              console.error('Error creating new users table:', err);
              return;
            }
            
            // Copy data from old table to new table
            db.run(`INSERT INTO users_new (id, username, email, role, avatar_url, discord_id, playfab_id, steam64_id, notes, recruitment_date, created_at, last_login)
                    SELECT id, username, email, role, avatar_url, discord_id, playfab_id, steam64_id, notes, recruitment_date, created_at, last_login FROM users`, (err) => {
              if (err) {
                console.error('Error copying data:', err);
                return;
              }
              
              // Drop old table and rename new table
              db.run('DROP TABLE users', (err) => {
                if (err) {
                  console.error('Error dropping old table:', err);
                  return;
                }
                
                db.run('ALTER TABLE users_new RENAME TO users', (err) => {
                  if (err) {
                    console.error('Error renaming table:', err);
                    return;
                  }
                  console.log('Successfully recreated users table with nullable password_hash');
                });
              });
            });
          });
        } else {
          // Create table normally if no constraint issue
          db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT DEFAULT 'user',
            avatar_url TEXT,
            discord_id TEXT UNIQUE,
            password_hash TEXT,
            playfab_id TEXT,
            steam64_id TEXT,
            notes TEXT,
            recruitment_date DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
          )`);
        }
      });
    });

    // Add discord_id column if it doesn't exist (migration)
    db.run(`ALTER TABLE users ADD COLUMN discord_id TEXT UNIQUE`, (err) => {
      if (err && err.code !== 'SQLITE_ERROR') {
        console.log('discord_id column already exists or error:', err.message);
      } else {
        console.log('Added discord_id column to users table');
      }
    });

    // Add staff-related columns if they don't exist (migration)
    db.run(`ALTER TABLE users ADD COLUMN playfab_id TEXT`, (err) => {
      if (err && err.code !== 'SQLITE_ERROR') {
        console.log('playfab_id column already exists or error:', err.message);
      } else {
        console.log('Added playfab_id column to users table');
      }
    });

    db.run(`ALTER TABLE users ADD COLUMN steam64_id TEXT`, (err) => {
      if (err && err.code !== 'SQLITE_ERROR') {
        console.log('steam64_id column already exists or error:', err.message);
      } else {
        console.log('Added steam64_id column to users table');
      }
    });

    db.run(`ALTER TABLE users ADD COLUMN notes TEXT`, (err) => {
      if (err && err.code !== 'SQLITE_ERROR') {
        console.log('notes column already exists or error:', err.message);
      } else {
        console.log('Added notes column to users table');
      }
    });

    db.run(`ALTER TABLE users ADD COLUMN recruitment_date DATETIME`, (err) => {
      if (err && err.code !== 'SQLITE_ERROR') {
        console.log('recruitment_date column already exists or error:', err.message);
      } else {
        console.log('Added recruitment_date column to users table');
      }
    });

    db.run(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'Active'`, (err) => {
      if (err && err.code !== 'SQLITE_ERROR') {
        console.log('status column already exists or error:', err.message);
      } else {
        console.log('Added status column to users table');
      }
    });



    // Posts table
    db.run(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER,
      category TEXT DEFAULT 'general',
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users (id)
    )`);

    // Events table
    db.run(`CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      event_date DATETIME NOT NULL,
      location TEXT,
      max_participants INTEGER,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users (id)
    )`);

    // Past staff table
    db.run(`CREATE TABLE IF NOT EXISTS past_staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_id TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      display_name TEXT NOT NULL,
      rank TEXT NOT NULL,
      playfab_id TEXT,
      recruitment_date DATETIME,
      removal_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      removal_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Staff documents table
    db.run(`CREATE TABLE IF NOT EXISTS staff_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      access_level TEXT DEFAULT 'Admin',
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_published BOOLEAN DEFAULT 1
    )`);

    // Note: Admin users will be created through Discord OAuth with appropriate roles
  });
}

// Initialize database
initializeDatabase();

// Routes
app.use('/api/discord-auth', discordAuthLimiter, require('./routes/discord-auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/events', require('./routes/events'));
app.use('/api/users', require('./routes/users'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/staff-documents', require('./routes/staff-documents'));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Catch all handler for React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, db }; 