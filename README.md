# Dans Duels - Gaming Community Website

A modern, full-stack gaming community website built with React, Node.js, and SQLite. Features a beautiful gaming-themed UI with authentication, community posts, events, and admin functionality.

## 🎮 Features

### Frontend (React + TypeScript)
- **Modern Gaming UI**: Beautiful dark theme with neon accents and glass morphism effects
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Authentication System**: Login/register with JWT tokens
- **Protected Routes**: Role-based access control (user/admin)
- **Real-time Updates**: Live community interactions
- **Tailwind CSS**: Custom gaming-themed styling

### Backend (Node.js + Express)
- **RESTful API**: Clean, well-structured endpoints
- **SQLite Database**: Lightweight, file-based database
- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Admin and user permissions
- **Rate Limiting**: Protection against abuse
- **Security Middleware**: Helmet, CORS, and other security features

### Core Functionality
- **User Management**: Registration, login, profile management
- **Community Posts**: Create, read, update, delete posts
- **Events System**: Create and manage gaming events/tournaments
- **Admin Dashboard**: User management, content moderation
- **Real-time Features**: Live updates and notifications

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd DansDuelsWebsite
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start both the backend server (port 5000) and frontend development server (port 3000).

### Manual Installation (Alternative)

If the above doesn't work, install dependencies manually:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

Then start the servers:

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm start
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

### Database

The SQLite database will be automatically created when you first run the server. The default admin account is:

- **Username**: admin
- **Password**: admin123

## 📁 Project Structure

```
DansDuelsWebsite/
├── server/                 # Backend API
│   ├── routes/            # API routes
│   │   ├── auth.js        # Authentication routes
│   │   ├── posts.js       # Community posts
│   │   ├── events.js      # Events/tournaments
│   │   └── users.js       # User management
│   ├── index.js           # Main server file
│   └── package.json       # Backend dependencies
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   └── App.tsx        # Main app component
│   ├── public/            # Static files
│   └── package.json       # Frontend dependencies
└── package.json           # Root package.json
```

## 🎨 UI/UX Features

### Design System
- **Color Palette**: Dark gaming theme with purple/pink gradients
- **Typography**: Inter font family for modern readability
- **Animations**: Smooth transitions and hover effects
- **Glass Morphism**: Translucent elements with backdrop blur
- **Neon Effects**: Glowing elements for gaming aesthetic

### Components
- **Navbar**: Responsive navigation with user menu
- **Forms**: Modern form inputs with validation
- **Cards**: Glass-effect cards for content display
- **Buttons**: Gradient buttons with hover effects
- **Loading States**: Spinners and skeleton loaders

## 🔐 Authentication & Security

### Features
- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control
- Protected routes
- Rate limiting
- CORS protection
- Helmet security headers

### User Roles
- **User**: Basic community access
- **Admin**: Full administrative privileges

## 📱 Responsive Design

The website is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🛠️ Development

### Available Scripts

```bash
# Root level
npm run dev          # Start both servers
npm run server       # Start backend only
npm run client       # Start frontend only
npm run install-all  # Install all dependencies

# Backend (server/)
npm run dev          # Start with nodemon
npm start           # Start production server

# Frontend (client/)
npm start           # Start development server
npm run build       # Build for production
npm test            # Run tests
```

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

#### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

#### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

#### Users (Admin)
- `GET /api/users` - Get all users
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/role` - Update user role

## 🚀 Deployment

### Backend Deployment
1. Set environment variables
2. Run `npm run build` (if needed)
3. Start with `npm start`

### Frontend Deployment
1. Run `npm run build`
2. Serve the `build` folder
3. Configure proxy to backend API

## 🔮 Future Enhancements

### Planned Features
- **Real-time Chat**: WebSocket-based community chat
- **Tournament System**: Advanced tournament management
- **User Profiles**: Detailed user profiles with stats
- **Media Upload**: Image and video uploads
- **Notifications**: Push notifications for events
- **Leaderboards**: Competitive rankings
- **Game Integration**: Direct game server integration
- **Mobile App**: React Native mobile application

### Technical Improvements
- **Database Migration**: PostgreSQL for production
- **Caching**: Redis for performance
- **CDN**: Content delivery network
- **Monitoring**: Application monitoring and logging
- **Testing**: Comprehensive test suite
- **CI/CD**: Automated deployment pipeline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Ensure all dependencies are installed
3. Verify environment variables are set correctly
4. Check that both servers are running

For additional help, please open an issue in the repository.

---

**Built with ❤️ for the gaming community** 