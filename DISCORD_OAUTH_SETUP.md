# Discord OAuth Setup for Staff Login

This guide will help you set up Discord OAuth authentication for the staff login system on dansgaming.net.

## Prerequisites

1. A Discord server (guild) where your staff members are located
2. Discord Bot with appropriate permissions
3. Discord OAuth2 application

## Step 1: Create Discord OAuth2 Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name (e.g., "Dan's Gaming Community Staff")
3. Go to the "OAuth2" section in the left sidebar
4. Copy the "Client ID" and "Client Secret"
5. Add your redirect URI: `https://dansgaming.net/api/discord-auth/callback`
6. Save the changes

## Step 2: Create Discord Bot

1. In your Discord application, go to the "Bot" section
2. Click "Add Bot"
3. Copy the bot token
4. Go to "OAuth2" → "URL Generator"
5. Select scopes: `bot` and `identify`
6. Select bot permissions: `Read Messages/View Channels`
7. Copy the generated URL and add the bot to your server

## Step 3: Get Discord Server and Role IDs

1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click your Discord server and copy the Server ID
3. Right-click the staff roles you want to allow and copy their Role IDs
4. Note down all the role IDs you want to allow access

## Step 4: Configure Environment Variables

Create a `.env` file in the `server/` directory with the following variables:

```env
# JWT Secret for token signing
JWT_SECRET=your-super-secret-jwt-key-here

# Discord OAuth2 Configuration
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_REDIRECT_URI=https://dansgaming.net/api/discord-auth/callback
DISCORD_GUILD_ID=your-discord-server-id
DISCORD_BOT_TOKEN=your-discord-bot-token

# Allowed Discord Role IDs (comma-separated)
ALLOWED_ROLES=role-id-1,role-id-2,role-id-3

# Server Configuration
PORT=5000
```

## Step 5: Install Dependencies

Run the following command in the `server/` directory:

```bash
npm install axios
```

## Step 6: Update Database Schema

The database will automatically add the `discord_id` field to the users table when the server starts.

## Step 7: Test the Setup

1. Start your server
2. Navigate to the staff login page
3. Click "Login with Discord"
4. Authorize the application
5. If you have the required Discord role, you should be redirected to the admin panel

## Security Notes

- Keep your Discord bot token and client secret secure
- Use a strong JWT secret
- Regularly rotate your secrets
- Only give the bot the minimum required permissions
- Monitor the allowed roles list and update as needed

## Troubleshooting

### Common Issues:

1. **"Access denied" error**: Make sure the user has one of the allowed Discord roles
2. **"Invalid redirect URI"**: Verify the redirect URI matches exactly in Discord Developer Portal
3. **"Bot token invalid"**: Check that the bot token is correct and the bot is in your server
4. **"Guild not found"**: Ensure the guild ID is correct and the bot has access to the server

### Debug Steps:

1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test Discord API calls manually using tools like Postman
4. Ensure the bot has the `guilds.members.read` scope

## API Endpoints

- `GET /api/discord-auth/login` - Get Discord OAuth URL
- `GET /api/discord-auth/callback` - Handle OAuth callback
- `GET /api/discord-auth/verify` - Verify staff token

## Role Management

To add or remove allowed roles:

1. Get the role ID from Discord (right-click role → Copy ID)
2. Update the `ALLOWED_ROLES` environment variable
3. Restart the server

The system will automatically check if users have any of the allowed roles during authentication. 