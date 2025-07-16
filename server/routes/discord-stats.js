const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Use https module for Discord API calls
const https = require('https');
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

// Discord API configuration
const DISCORD_API_BASE = 'https://discord.com/api/v10';
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Discord API configuration loaded

// Helper function to make Discord API requests
const discordApiRequest = (endpoint, token = BOT_TOKEN) => {
  return new Promise((resolve, reject) => {
    try {
          const url = `${DISCORD_API_BASE}${endpoint}`;
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      }
    };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const jsonData = JSON.parse(data);
              resolve(jsonData);
            } catch (parseError) {
              console.error('Failed to parse Discord API response:', parseError);
              reject(new Error('Invalid JSON response from Discord API'));
            }
          } else {
            console.error(`Discord API error ${res.statusCode}:`, data);
            reject(new Error(`Discord API error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('Discord API request failed:', error);
        reject(error);
      });

      req.end();
    } catch (error) {
      console.error('Error in discordApiRequest:', error);
      reject(error);
    }
  });
};

// Get server statistics
router.get('/server-stats', authenticateToken, async (req, res) => {
  try {
    // Fetch Discord server statistics
    
    if (!GUILD_ID || !BOT_TOKEN) {
      console.log('Missing Discord configuration:', { GUILD_ID, BOT_TOKEN: BOT_TOKEN ? '***' : 'undefined' });
      return res.status(500).json({ 
        error: 'Discord configuration missing. Please check GUILD_ID and BOT_TOKEN environment variables.' 
      });
    }

    // Fetch guild (server) information
    const guild = await discordApiRequest(`/guilds/${GUILD_ID}?with_counts=true`);
    
    // Fetch guild members (we'll get a sample for online count)
    const members = await discordApiRequest(`/guilds/${GUILD_ID}/members?limit=1000`);
    
    // Fetch guild channels
    const channels = await discordApiRequest(`/guilds/${GUILD_ID}/channels`);

    // Calculate online members (approximate based on presence)
    const onlineMembers = members.filter(member => 
      member.status !== 'offline' && !member.user?.bot
    ).length;

    // Count active channels (text channels)
    const activeChannels = channels.filter(channel => 
      channel.type === 0 // Text channels
    ).length;

    // Get role counts
    const roles = await discordApiRequest(`/guilds/${GUILD_ID}/roles`);
    const memberRoles = roles.filter(role => 
      role.name !== '@everyone' && role.managed === false
    );

    const stats = {
      totalMembers: guild.approximate_member_count || 0,
      onlineMembers: onlineMembers,
      activeChannels: activeChannels,
      totalRoles: memberRoles.length,
      serverName: guild.name,
      serverIcon: guild.icon ? `https://cdn.discordapp.com/icons/${GUILD_ID}/${guild.icon}.png` : null,
      verificationLevel: guild.verification_level,
      boostLevel: guild.premium_tier,
      boostCount: guild.premium_subscription_count || 0,
      createdAt: guild.created_at
    };

    res.json(stats);
      } catch (error) {
      console.error('Error fetching server stats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch server statistics',
        details: error.message,
        config: {
          guildIdSet: !!GUILD_ID,
          botTokenSet: !!BOT_TOKEN
        }
      });
    }
});

// Get recent activity from Discord audit logs
router.get('/recent-activity', authenticateToken, async (req, res) => {
  try {
    if (!GUILD_ID || !BOT_TOKEN) {
      return res.status(500).json({ 
        error: 'Discord configuration missing',
        config: {
          guildIdSet: !!GUILD_ID,
          botTokenSet: !!BOT_TOKEN
        }
      });
    }

    // Fetch recent audit logs (last 50 entries)
    const auditLogs = await discordApiRequest(`/guilds/${GUILD_ID}/audit-logs?limit=50`);
    
    // Process audit logs into activity format
    const activities = [];
    const processedIds = new Set();

    if (auditLogs.audit_log_entries) {
      for (const entry of auditLogs.audit_log_entries) {
        if (processedIds.has(entry.id)) continue; // Avoid duplicates
        processedIds.add(entry.id);

        const action = entry.action_type;
        const targetId = entry.target_id;
        const userId = entry.user_id;
        const reason = entry.reason || 'No reason provided';
        
        // Parse Discord timestamp properly
        let timestamp;
        try {
          // Discord timestamps are often in milliseconds since epoch
          const timestampValue = parseInt(entry.created_timestamp);
          if (isNaN(timestampValue)) {
            console.warn('Invalid timestamp:', entry.created_timestamp);
            timestamp = new Date().toISOString(); // Fallback to current time
          } else {
            timestamp = new Date(timestampValue).toISOString();
          }
        } catch (error) {
          console.warn('Error parsing timestamp:', error);
          timestamp = new Date().toISOString(); // Fallback to current time
        }

        // Get user info from the users array
        const user = auditLogs.users?.find(u => u.id === userId);
        const targetUser = auditLogs.users?.find(u => u.id === targetId);
        
        let activity = {
          id: entry.id,
          timestamp: timestamp,
          type: action,
          user: user ? `${user.username}#${user.discriminator}` : 'Unknown User',
          details: '',
          moderator: user ? `${user.username}#${user.discriminator}` : 'Unknown User'
        };

        // Map Discord action types to readable descriptions
        switch (action) {
          case 1: // GUILD_UPDATE
            activity.details = 'Server settings updated';
            break;
          case 10: // CHANNEL_CREATE
            activity.details = 'Channel created';
            break;
          case 11: // CHANNEL_UPDATE
            activity.details = 'Channel updated';
            break;
          case 12: // CHANNEL_DELETE
            activity.details = 'Channel deleted';
            break;
          case 13: // CHANNEL_OVERWRITE_CREATE
            activity.details = 'Channel permissions updated';
            break;
          case 14: // CHANNEL_OVERWRITE_UPDATE
            activity.details = 'Channel permissions updated';
            break;
          case 15: // CHANNEL_OVERWRITE_DELETE
            activity.details = 'Channel permissions removed';
            break;
          case 20: // MEMBER_KICK
            activity.details = `Kicked ${targetUser ? targetUser.username : 'user'}`;
            break;
          case 21: // MEMBER_PRUNE
            activity.details = 'Members pruned from server';
            break;
          case 22: // MEMBER_BAN_ADD
            activity.details = `Banned ${targetUser ? targetUser.username : 'user'}`;
            break;
          case 23: // MEMBER_BAN_REMOVE
            activity.details = `Unbanned ${targetUser ? targetUser.username : 'user'}`;
            break;
          case 24: // MEMBER_UPDATE
            activity.details = 'Member updated';
            break;
          case 25: // MEMBER_ROLE_UPDATE
            activity.details = 'Member roles updated';
            break;
          case 26: // MEMBER_MOVE
            activity.details = 'Member moved to voice channel';
            break;
          case 27: // MEMBER_DISCONNECT
            activity.details = 'Member disconnected from voice';
            break;
          case 28: // BOT_ADD
            activity.details = 'Bot added to server';
            break;
          case 30: // ROLE_CREATE
            activity.details = 'Role created';
            break;
          case 31: // ROLE_UPDATE
            activity.details = 'Role updated';
            break;
          case 32: // ROLE_DELETE
            activity.details = 'Role deleted';
            break;
          case 40: // INVITE_CREATE
            activity.details = 'Invite created';
            break;
          case 41: // INVITE_UPDATE
            activity.details = 'Invite updated';
            break;
          case 42: // INVITE_DELETE
            activity.details = 'Invite deleted';
            break;
          case 50: // WEBHOOK_CREATE
            activity.details = 'Webhook created';
            break;
          case 51: // WEBHOOK_UPDATE
            activity.details = 'Webhook updated';
            break;
          case 52: // WEBHOOK_DELETE
            activity.details = 'Webhook deleted';
            break;
          case 60: // EMOJI_CREATE
            activity.details = 'Emoji created';
            break;
          case 61: // EMOJI_UPDATE
            activity.details = 'Emoji updated';
            break;
          case 62: // EMOJI_DELETE
            activity.details = 'Emoji deleted';
            break;
          case 72: // MESSAGE_DELETE
            activity.details = 'Message deleted';
            break;
          case 73: // MESSAGE_BULK_DELETE
            activity.details = 'Messages bulk deleted';
            break;
          case 74: // MESSAGE_PIN
            activity.details = 'Message pinned';
            break;
          case 75: // MESSAGE_UNPIN
            activity.details = 'Message unpinned';
            break;
          case 80: // INTEGRATION_CREATE
            activity.details = 'Integration created';
            break;
          case 81: // INTEGRATION_UPDATE
            activity.details = 'Integration updated';
            break;
          case 82: // INTEGRATION_DELETE
            activity.details = 'Integration deleted';
            break;
          case 83: // STAGE_INSTANCE_CREATE
            activity.details = 'Stage instance created';
            break;
          case 84: // STAGE_INSTANCE_UPDATE
            activity.details = 'Stage instance updated';
            break;
          case 85: // STAGE_INSTANCE_DELETE
            activity.details = 'Stage instance deleted';
            break;
          case 90: // STICKER_CREATE
            activity.details = 'Sticker created';
            break;
          case 91: // STICKER_UPDATE
            activity.details = 'Sticker updated';
            break;
          case 92: // STICKER_DELETE
            activity.details = 'Sticker deleted';
            break;
          case 100: // GUILD_SCHEDULED_EVENT_CREATE
            activity.details = 'Scheduled event created';
            break;
          case 101: // GUILD_SCHEDULED_EVENT_UPDATE
            activity.details = 'Scheduled event updated';
            break;
          case 102: // GUILD_SCHEDULED_EVENT_DELETE
            activity.details = 'Scheduled event deleted';
            break;
          case 110: // THREAD_CREATE
            activity.details = 'Thread created';
            break;
          case 111: // THREAD_UPDATE
            activity.details = 'Thread updated';
            break;
          case 112: // THREAD_DELETE
            activity.details = 'Thread deleted';
            break;
          default:
            activity.details = `Action type ${action} performed`;
        }

        // Add reason if available
        if (reason && reason !== 'No reason provided') {
          activity.details += ` - ${reason}`;
        }

        activities.push(activity);
      }
    }

    // Sort by timestamp (newest first) and limit to 20 entries
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivities = activities.slice(0, 20);

    res.json(recentActivities);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent activity',
      details: error.message 
    });
  }
});

// Get moderation logs (simulated for now)
router.get('/moderation-logs', authenticateToken, async (req, res) => {
  try {
    // For now, we'll return simulated moderation logs
    // In a real implementation, you'd fetch this from Discord's audit logs
    const logs = [
      {
        id: 1,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        action: 'ban',
        moderator: 'Admin#1234',
        user: '@spammer123',
        reason: 'Repeated violations of community guidelines',
        duration: null
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        action: 'timeout',
        moderator: 'Moderator#5678',
        user: '@rudeuser',
        reason: 'Inappropriate language in general chat',
        duration: '1 hour'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        action: 'warning',
        moderator: 'Helper#9012',
        user: '@newmember',
        reason: 'First offense - minor rule violation',
        duration: null
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        action: 'kick',
        moderator: 'Admin#3456',
        user: '@troublemaker',
        reason: 'Spamming in multiple channels',
        duration: null
      }
    ];

    res.json(logs);
  } catch (error) {
    console.error('Error fetching moderation logs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch moderation logs',
      details: error.message 
    });
  }
});

// Test endpoint to verify Discord connection
router.get('/test', authenticateToken, async (req, res) => {
  try {
    if (!GUILD_ID || !BOT_TOKEN) {
      return res.status(500).json({ 
        error: 'Discord configuration missing',
        config: {
          guildIdSet: !!GUILD_ID,
          botTokenSet: !!BOT_TOKEN
        }
      });
    }

    // Test basic guild fetch
    const guild = await discordApiRequest(`/guilds/${GUILD_ID}`);
    
    res.json({
      success: true,
      guild: {
        id: guild.id,
        name: guild.name,
        memberCount: guild.approximate_member_count,
        icon: guild.icon
      }
    });
  } catch (error) {
    console.error('Discord test failed:', error);
    res.status(500).json({ 
      error: 'Discord test failed',
      details: error.message
    });
  }
});

module.exports = router; 