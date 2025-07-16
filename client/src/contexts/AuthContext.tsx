import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar_url?: string;
  discord_id?: string;
  discord_roles?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loginWithStaffToken: (token: string, userData: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('staffToken'));
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Set up axios defaults
  useEffect(() => {
    if (token && !isLoggingOut) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token, isLoggingOut]);

  // Check if user is authenticated on app load
  useEffect(() => {
    // Don't check auth if we're in the process of logging out
    if (isLoggingOut) {
      console.log('Skipping auth check - logout in progress');
      return;
    }

    const checkAuth = async () => {
      console.log('Checking authentication...', { 
        token: !!token, 
        isLoggingOut,
        localStorageToken: !!localStorage.getItem('staffToken'),
        localStorageGenericToken: !!localStorage.getItem('token'),
        currentPath: window.location.pathname
      });
      
      if (token) {
        try {
          const response = await axios.get('/api/discord-auth/verify');
          console.log('Auth check response:', response.data);
          setUser(response.data.user);
          console.log('Staff auth check successful');
        } catch (error) {
          console.error('Staff auth check failed:', error);
          localStorage.removeItem('staffToken');
          localStorage.removeItem('token');
          setToken(null);
        }
      } else {
        console.log('No token found - user not authenticated');
        // Double-check localStorage and clear any remaining tokens
        if (localStorage.getItem('staffToken') || localStorage.getItem('token')) {
          console.log('Found lingering tokens in localStorage, clearing...');
          localStorage.removeItem('staffToken');
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token, isLoggingOut]);

  const loginWithStaffToken = (newToken: string, userData: User) => {
    // Don't allow login if we're logging out
    if (isLoggingOut) {
      console.log('Login blocked - logout in progress');
      return;
    }

    console.log('loginWithStaffToken called with:', { newToken: !!newToken, userData });
    localStorage.setItem('staffToken', newToken);
    setToken(newToken);
    setUser(userData);
    console.log('Staff token and user set in AuthContext');
  };

  const logout = () => {
    console.log('Logout called - clearing all auth data');
    
    // Set logout flag to prevent re-authentication
    setIsLoggingOut(true);
    
    // Clear localStorage multiple times to ensure it's gone
    localStorage.removeItem('staffToken');
    localStorage.removeItem('token'); // Also clear any generic token
    localStorage.removeItem('user'); // Clear any stored user data
    
    // Clear state
    setToken(null);
    setUser(null);
    
    // Clear axios headers
    delete axios.defaults.headers.common['Authorization'];
    
    console.log('Logout completed - auth state cleared');
    
    // Reset logout flag after a longer delay and only if we're not on staff-login page
    setTimeout(() => {
      // Only reset if we're not on the staff-login page
      if (window.location.pathname !== '/staff-login') {
        console.log('Resetting logout flag - not on staff-login page');
        setIsLoggingOut(false);
      } else {
        console.log('Keeping logout flag active - on staff-login page');
        // Keep the flag active while on staff-login page
        setTimeout(() => {
          setIsLoggingOut(false);
        }, 5000); // Reset after 5 more seconds
      }
    }, 2000); // Increased from 1 second to 2 seconds
  };

  const value = {
    user,
    token,
    loginWithStaffToken,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 