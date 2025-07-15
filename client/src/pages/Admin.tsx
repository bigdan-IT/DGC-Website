import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: number;
  username: string;
  role: string;
  discord_id?: string;
  discord_roles?: string[];
}

// Role hierarchy - higher numbers = higher permissions
const ROLE_PERMISSIONS: { [key: string]: number } = {
  '1394520034700693534': 3, // Founder - highest level
  '765079181666156545': 2,  // Management - second level
  '885301651538329651': 1,  // Admin - lowest level
};

// Dashboard sections with required permission levels
const DASHBOARD_SECTIONS = [
  {
    id: 'servers',
    title: 'Servers',
    description: 'View and manage your current game servers',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    bgColor: 'bg-orange-500',
    buttonColor: 'bg-orange-600 hover:bg-orange-700',
    buttonText: 'View Servers',
    requiredLevel: 1, // Admin level
  },
  {
    id: 'users',
    title: 'Users',
    description: 'Manage Discord user roles and permissions',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
    bgColor: 'bg-blue-500',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    buttonText: 'Manage Users',
    requiredLevel: 2, // Management level
  },
  {
    id: 'staff-roster',
    title: 'Staff Roster',
    description: 'View and manage the current staff team',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    bgColor: 'bg-purple-500',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
    buttonText: 'View Roster',
    requiredLevel: 2, // Management level
  },
  {
    id: 'logs',
    title: 'Logs',
    description: 'View server logs and activity history',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    bgColor: 'bg-green-500',
    buttonColor: 'bg-green-600 hover:bg-green-700',
    buttonText: 'View Logs',
    requiredLevel: 1, // Admin level
  },
  {
    id: 'staff-info',
    title: 'Staff Info',
    description: 'Access staff guidelines and information',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bgColor: 'bg-indigo-500',
    buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
    buttonText: 'View Info',
    requiredLevel: 1, // Admin level
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure website and community settings',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    bgColor: 'bg-gray-500',
    buttonColor: 'bg-gray-600 hover:bg-gray-700',
    buttonText: 'Open Settings',
    requiredLevel: 3, // Founder level
  },
];

const Admin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loginWithStaffToken, loading, logout } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Get user's permission level based on their Discord roles
  const getUserPermissionLevel = (user: User): number => {
    if (!user.discord_roles || user.discord_roles.length === 0) {
      console.log('No Discord roles found for user:', user.username);
      return 0;
    }
    
    // Check for the highest permission level the user has
    let highestLevel = 0;
    const validRoles: string[] = [];
    
    user.discord_roles.forEach(roleId => {
      const level = ROLE_PERMISSIONS[roleId];
      if (level) {
        validRoles.push(roleId);
        if (level > highestLevel) {
          highestLevel = level;
        }
      }
    });
    
    console.log('User permission calculation:', {
      username: user.username,
      allRoles: user.discord_roles,
      validRoles: validRoles,
      highestLevel: highestLevel,
      roleNames: validRoles.map(roleId => {
        switch(roleId) {
          case '1394520034700693534': return 'Founder';
          case '765079181666156545': return 'Management';
          case '885301651538329651': return 'Admin';
          default: return `Unknown (${roleId})`;
        }
      })
    });
    
    return highestLevel;
  };

  // Get user's highest role name for display
  const getUserRoleName = (user: User): string => {
    const level = getUserPermissionLevel(user);
    switch(level) {
      case 3: return 'Founder';
      case 2: return 'Management';
      case 1: return 'Admin';
      default: return 'No Access';
    }
  };

  // Check if user has permission for a specific section
  const hasPermission = (requiredLevel: number): boolean => {
    if (!user) return false;
    const userLevel = getUserPermissionLevel(user);
    console.log('Permission check:', { 
      userRoles: user.discord_roles, 
      userLevel, 
      requiredLevel, 
      hasPermission: userLevel >= requiredLevel 
    });
    return userLevel >= requiredLevel;
  };

  useEffect(() => {
    const token = searchParams.get('token');
    console.log('Admin component useEffect:', { token: !!token, user: !!user, loading });
    
    if (token && !user) {
      console.log('Token found, verifying...');
      setIsProcessing(true);
      // Verify the token and get user info
      verifyToken(token);
    } else if (!user && !loading) {
      console.log('No token and no user, redirecting to staff login');
      // No token and no user, redirect to staff login
      navigate('/staff-login');
    }
  }, [searchParams, user, loading, navigate]);

  // Refresh user's Discord roles on every page load
  useEffect(() => {
    if (user && user.discord_id && !isProcessing && !isLoggingOut) {
      refreshUserRoles();
    }
  }, [user, isProcessing, isLoggingOut]);

  const refreshUserRoles = async () => {
    try {
      const response = await fetch('/api/discord-auth/verify', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('staffToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update the user with fresh Discord roles
        loginWithStaffToken(localStorage.getItem('staffToken') || '', data.user);
      }
    } catch (error) {
      console.error('Error refreshing user roles:', error);
    }
  };

  const verifyToken = async (token: string) => {
    console.log('Verifying token...');
    try {
      const response = await fetch('/api/discord-auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Token verification response:', response.status, response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Token verification successful, user data:', data.user);
        // Use the AuthContext to set the user
        loginWithStaffToken(token, data.user);
        // Remove token from URL
        const currentPath = window.location.pathname;
        window.history.replaceState({}, document.title, currentPath);
        console.log('Token verification complete, user should be logged in');
      } else {
        console.log('Token verification failed, redirecting to staff login');
        // Token is invalid, redirect to staff login
        navigate('/staff-login');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      navigate('/staff-login');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    console.log('Admin logout handler called');
    setIsLoggingOut(true);
    logout();
    // Force a small delay to ensure logout completes before navigation
    setTimeout(() => {
      navigate('/staff-login');
    }, 100);
  };

  if (loading || isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="text-gray-300 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to staff-login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <div className="glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold gradient-text">
                {window.location.pathname === '/staff' ? 'Staff Dashboard' : 'Admin Dashboard'}
              </h1>
              <p className="text-gray-300 text-sm">
                Welcome, {user.username} • {getUserRoleName(user)}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DASHBOARD_SECTIONS.map((section) => {
            // Only show sections the user has permission to access
            if (!hasPermission(section.requiredLevel)) {
              return null;
            }

            return (
              <div key={section.id} className="glass p-6 rounded-xl border border-white/10">
                <div className="flex items-center mb-4">
                  <div className={`w-10 h-10 ${section.bgColor} rounded-lg flex items-center justify-center mr-3`}>
                    {section.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                </div>
                <p className="text-gray-300 text-sm mb-4">{section.description}</p>
                <button className={`w-full ${section.buttonColor} text-white py-2 px-4 rounded-lg transition-colors duration-200`}>
                  {section.buttonText}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Admin; 