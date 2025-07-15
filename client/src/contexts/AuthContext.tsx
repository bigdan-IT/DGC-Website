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

  // Set up axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      console.log('Checking authentication...', { token: !!token });
      
      if (token) {
        try {
          const response = await axios.get('/api/discord-auth/verify');
          setUser(response.data.user);
          console.log('Staff auth check successful');
        } catch (error) {
          console.error('Staff auth check failed:', error);
          localStorage.removeItem('staffToken');
          setToken(null);
        }
      } else {
        console.log('No token found - user not authenticated');
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const loginWithStaffToken = (newToken: string, userData: User) => {
    console.log('loginWithStaffToken called with:', { newToken: !!newToken, userData });
    localStorage.setItem('staffToken', newToken);
    setToken(newToken);
    setUser(userData);
    console.log('Staff token and user set in AuthContext');
  };

  const logout = () => {
    console.log('Logout called - clearing all auth data');
    
    // Clear localStorage
    localStorage.removeItem('staffToken');
    
    // Clear state
    setToken(null);
    setUser(null);
    
    // Clear axios headers
    delete axios.defaults.headers.common['Authorization'];
    
    console.log('Logout completed - auth state cleared');
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