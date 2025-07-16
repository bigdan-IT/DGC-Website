import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, User, LogOut, Settings, Shield } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/staff-login');
    setIsMenuOpen(false);
  };

  return (
    <nav className="glass border-b border-cyan-500/30 relative z-50 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="group">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center gaming-card neon-glow group-hover:scale-110 transition-transform duration-300">
                <span className="text-white font-bold text-2xl gaming-font">D</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link 
                to="/" 
                className="text-cyan-300 hover:text-cyan-400 transition-all duration-300 text-sm font-medium hover:scale-105"
              >
                Home
              </Link>
              <Link 
                to="/servers" 
                className="text-cyan-300 hover:text-cyan-400 transition-all duration-300 text-sm font-medium hover:scale-105"
              >
                Servers
              </Link>
              <Link 
                to="/rules" 
                className="text-cyan-300 hover:text-cyan-400 transition-all duration-300 text-sm font-medium hover:scale-105"
              >
                Rules
              </Link>
            </div>
          </div>

          {/* Right Side - Admin Link and User Menu */}
          <div className="flex items-center space-x-4">
            {(user?.role === 'admin' || user?.role === 'staff') && (
              <Link 
                to="/admin" 
                className="text-purple-400 hover:text-purple-300 transition-all duration-300 text-sm font-medium hover:scale-105 flex items-center space-x-1"
              >
                <Shield size={16} />
                <span>{user?.role === 'admin' ? 'Admin' : 'Staff'}</span>
              </Link>
            )}

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/profile" 
                    className="flex items-center space-x-2 text-cyan-300 hover:text-cyan-400 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-full flex items-center justify-center">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} className="w-8 h-8 rounded-full" />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <span>{user.username}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-cyan-300 hover:text-red-400 transition-colors duration-200"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/staff-login" 
                    className="text-cyan-300 hover:text-cyan-400 transition-all duration-300 text-sm font-medium"
                  >
                    Staff Login
                  </Link>
                  <a 
                    href="https://discord.com/invite/dans"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gaming-button"
                  >
                    Join Discord
                  </a>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-300 hover:text-white transition-colors duration-200"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-cyan-500/20">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-cyan-300 hover:text-cyan-400 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/servers" 
                className="text-cyan-300 hover:text-cyan-400 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Servers
              </Link>
              <Link 
                to="/rules" 
                className="text-cyan-300 hover:text-cyan-400 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Rules
              </Link>
              {(user?.role === 'admin' || user?.role === 'staff') && (
                <Link 
                  to="/admin" 
                  className="text-purple-400 hover:text-purple-300 transition-colors duration-200 flex items-center space-x-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield size={16} />
                  <span>{user?.role === 'admin' ? 'Admin' : 'Staff'}</span>
                </Link>
              )}
              
              {user ? (
                <>
                  <Link 
                    to="/profile" 
                    className="flex items-center space-x-2 text-cyan-300 hover:text-cyan-400 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-cyan-300 hover:text-red-400 transition-colors duration-200 text-left"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link 
                    to="/staff-login" 
                    className="text-cyan-300 hover:text-cyan-400 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Staff Login
                  </Link>
                  <a 
                    href="https://discord.com/invite/dans"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gaming-button text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Join Discord
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 