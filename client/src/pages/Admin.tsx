import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RichTextEditor from '../components/RichTextEditor';

interface User {
  id: number;
  username: string;
  role: string;
  discord_id?: string;
  discord_roles?: string[];
}

// Staff member interface
interface StaffMember {
  id: string;
  username: string;
  displayName: string;
  rank: 'Founder' | 'Management' | 'Admin';
  playfabId: string;
  recruitmentDate: string | null;
  status: 'Active' | 'Exempt' | 'Inactive' | 'On Leave';
  isActive: boolean;
  avatar: string | null;
}

// Past staff member interface
interface PastStaffMember {
  id: string;
  rank: string;
  name: string;
  playfabID: string;
  recruitmentDate: string;
  removalDate: string;
  removalReason: string;
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
    id: 'staff-info',
    title: 'Staff Information',
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
    requiredLevel: 1, // Admin level - can view
  },
  {
    id: 'discord',
    title: 'Discord',
    description: 'Review Discord logs and moderate the server',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    bgColor: 'bg-blue-500',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    buttonText: 'View Discord',
    requiredLevel: 2, // Management level
  },
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
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [staffRoster, setStaffRoster] = useState<StaffMember[]>([]);
  const [pastStaff, setPastStaff] = useState<PastStaffMember[]>([]);
  // const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showRemoveStaffModal, setShowRemoveStaffModal] = useState(false);
  const [removingMember, setRemovingMember] = useState<StaffMember | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const [showEditPastStaffModal, setShowEditPastStaffModal] = useState(false);
  const [editingPastMember, setEditingPastMember] = useState<PastStaffMember | null>(null);
  const [showRemovePastStaffModal, setShowRemovePastStaffModal] = useState(false);
  const [removingPastMember, setRemovingPastMember] = useState<PastStaffMember | null>(null);
  const [editingPastStaffData, setEditingPastStaffData] = useState({
    name: '',
    rank: 'Admin' as 'Founder' | 'Management' | 'Admin',
    playfabID: '',
    recruitmentDate: '',
    removalReason: ''
  });
  const [isSavingPastStaff, setIsSavingPastStaff] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'Founder' | 'Management' | 'Admin'>('Admin');
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [editingStaffData, setEditingStaffData] = useState({
    playfabId: '',
    recruitmentDate: '',
    rank: 'Admin' as 'Founder' | 'Management' | 'Admin',
    status: 'Active' as 'Active' | 'Exempt' | 'Inactive' | 'On Leave'
  });
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [isRemovingStaff, setIsRemovingStaff] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // const [showExportModal, setShowExportModal] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Staff Info state
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showCreateDocumentModal, setShowCreateDocumentModal] = useState(false);
  const [showEditDocumentModal, setShowEditDocumentModal] = useState(false);
  const [showViewDocumentModal, setShowViewDocumentModal] = useState(false);
  const [showDeleteDocumentModal, setShowDeleteDocumentModal] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState<any>(null);
  const [documentForm, setDocumentForm] = useState({
    title: '',
    content: '',
    category: 'general',
    access_level: 'Admin' as 'Admin' | 'Management' | 'Founder'
  });
  const [isSavingDocument, setIsSavingDocument] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  // Discord Stats state
  const [discordStats, setDiscordStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [moderationLogs, setModerationLogs] = useState<any[]>([]);
  const [isLoadingDiscordData, setIsLoadingDiscordData] = useState(false);

  // Click outside handler for export dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    if (showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

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
    
    // Only log if there are no valid roles or if this is the first time calculating
    if (validRoles.length === 0) {
      console.log('User permission calculation - no valid roles:', {
      username: user.username,
        allRoles: user.discord_roles
      });
    }
    
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
    
    // Only log if user doesn't have permission
    if (userLevel < requiredLevel) {
      console.log('Permission denied:', { 
      userRoles: user.discord_roles, 
      userLevel, 
      requiredLevel, 
        hasPermission: false 
    });
    }
    
    return userLevel >= requiredLevel;
  };

  const verifyToken = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/discord-auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Use the AuthContext to set the user
        loginWithStaffToken(token, data.user);
        // Remove token from URL
        const currentPath = window.location.pathname;
        window.history.replaceState({}, document.title, currentPath);
      } else {
        // Token is invalid, redirect to staff login
        navigate('/staff-login');
      }
    } catch (error) {
      console.error('Token verification error:', error);
      navigate('/staff-login');
    } finally {
      setIsProcessing(false);
    }
  }, [loginWithStaffToken, navigate, setIsProcessing]);

  const refreshUserRoles = useCallback(async () => {
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
  }, [loginWithStaffToken]);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token && !user) {
      setIsProcessing(true);
      // Verify the token and get user info
      verifyToken(token);
    } else if (!user && !loading) {
      // No token and no user, redirect to staff login
      navigate('/staff-login');
    }
  }, [searchParams, user, loading, navigate, verifyToken]);

  // Refresh user's Discord roles on every page load
  useEffect(() => {
    console.log('Admin role refresh effect:', { 
      hasUser: !!user, 
      hasDiscordId: !!user?.discord_id, 
      isProcessing, 
      currentPath: window.location.pathname 
    });
    
    if (user && user.discord_id && !isProcessing) {
      // Don't refresh roles if we're on staff-login page (user might be logging out)
      if (window.location.pathname === '/staff-login') {
        console.log('Skipping role refresh - on staff-login page');
        return;
      }
      
      // Only refresh roles once when the component mounts or user changes
      // Don't refresh if we already have Discord roles
      if (user.discord_roles && user.discord_roles.length > 0) {
        console.log('Skipping role refresh - user already has Discord roles');
        return;
      }
      
      refreshUserRoles();
    }
  }, [user?.id, isProcessing, refreshUserRoles, user]); // Include all dependencies

  const handleLogout = () => {
    logout();
    // Navigate immediately - AuthContext will handle the logout state
    navigate('/staff-login');
  };

  // Staff roster management functions
  const loadStaffRoster = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      if (!token) {
        console.error('No staff token found');
        return;
      }

      const response = await fetch('/api/staff/roster', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          const retryAfter = errorData.retryAfter || 60;
          alert(`Discord API rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
          return;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStaffRoster(data.activeStaff || []);
      setPastStaff(data.pastStaff || []);
    } catch (error) {
      console.error('Error loading staff roster:', error);
      // Fallback to empty arrays if API fails
      setStaffRoster([]);
      setPastStaff([]);
    }
  };

  const handlePanelClick = (panelId: string) => {
    setActivePanel(panelId);
    if (panelId === 'staff-roster') {
      loadStaffRoster();
    } else if (panelId === 'staff-info') {
      loadDocuments();
    } else if (panelId === 'discord') {
      loadDiscordData();
    }
  };

  const handleBackToDashboard = () => {
    setActivePanel(null);
    setEditingMember(null);
    setShowAddStaffModal(false);
    setShowRemoveStaffModal(false);
    setShowEditPastStaffModal(false);
    setEditingPastMember(null);
    setShowRemovePastStaffModal(false);
    setRemovingPastMember(null);
  };

  // Search guild members
  const searchMembers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('staffToken');
      if (!token) {
        console.error('No staff token found');
        return;
      }

      const response = await fetch(`/api/staff/search-members?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          const retryAfter = errorData.retryAfter || 60;
          alert(`Discord API rate limit exceeded. Please wait ${retryAfter} seconds before trying again. Try refreshing the page to use cached data.`);
          return;
        }
        
        if (response.status === 500 && errorData.message) {
          alert(`Search error: ${errorData.message}`);
          return;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data.members || []);
    } catch (error) {
      console.error('Error searching members:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Add role to user
  const addRoleToUser = async (userId: string, roleName: string) => {
    setIsAddingRole(true);
    try {
      const token = localStorage.getItem('staffToken');
      if (!token) {
        console.error('No staff token found');
        return;
      }

      const response = await fetch('/api/staff/add-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, roleName })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          const retryAfter = errorData.retryAfter || 60;
          alert(`Discord API rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
          return;
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Add the new staff member to the roster
        setStaffRoster(prev => [...prev, data.staffMember]);
        setShowAddStaffModal(false);
        setSearchQuery('');
        setSearchResults([]);
        alert(data.message);
      }
    } catch (error) {
      console.error('Error adding role:', error);
      alert('Failed to add role. Please check bot permissions.');
    } finally {
      setIsAddingRole(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear results if query is too short
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    // Debounce search with longer delay to prevent rate limiting
    setTimeout(() => {
      searchMembers(query);
    }, 800);
  };

  // Handle add staff modal
  const handleAddStaff = () => {
    setShowAddStaffModal(!showAddStaffModal);
    if (showAddStaffModal) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleEditStaff = (member: StaffMember) => {
    setEditingMember(member);
    setEditingStaffData({
      playfabId: member.playfabId || '',
      recruitmentDate: member.recruitmentDate || '',
      rank: member.rank,
      status: member.status || 'Active'
    });
    setShowEditStaffModal(true);
  };

  const handleSaveStaff = async () => {
    if (!editingMember) return;
    
    setIsSavingStaff(true);
    try {
      const token = localStorage.getItem('staffToken');
      if (!token) {
        console.error('No staff token found');
        return;
      }

      const response = await fetch('/api/staff/update-staff', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          discordId: editingMember.id,
          playfabId: editingStaffData.playfabId,
          recruitmentDate: editingStaffData.recruitmentDate || null,
          status: editingStaffData.status
        })
      });

      if (response.ok) {
        // Update the staff roster with new data
        setStaffRoster(prev => prev.map(member => 
          member.id === editingMember.id 
            ? {
                ...member,
                playfabId: editingStaffData.playfabId,
                recruitmentDate: editingStaffData.recruitmentDate || null,
                status: editingStaffData.status
              }
            : member
        ));
        
        setShowEditStaffModal(false);
        setEditingMember(null);
        setEditingStaffData({ playfabId: '', recruitmentDate: '', rank: 'Admin', status: 'Active' });
      } else {
        console.error('Failed to update staff member');
      }
    } catch (error) {
      console.error('Error updating staff member:', error);
    } finally {
      setIsSavingStaff(false);
    }
  };

  const handleChangeRole = async () => {
    if (!editingMember || editingStaffData.rank === editingMember.rank) return;
    
    setIsChangingRole(true);
    try {
      const token = localStorage.getItem('staffToken');
      if (!token) {
        console.error('No staff token found');
        return;
      }

      // First remove the current role
      const removeResponse = await fetch('/api/staff/remove-role', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: editingMember.id,
          roleName: editingMember.rank
        })
      });

      if (!removeResponse.ok) {
        const errorData = await removeResponse.json().catch(() => ({}));
        
        if (removeResponse.status === 429) {
          const retryAfter = errorData.retryAfter || 60;
          alert(`Discord API rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
          return;
        }
        
        console.error('Failed to remove current role');
        return;
      }

      // Then add the new role
      const addResponse = await fetch('/api/staff/add-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: editingMember.id,
          roleName: editingStaffData.rank
        })
      });

      if (!addResponse.ok) {
        const errorData = await addResponse.json().catch(() => ({}));
        
        if (addResponse.status === 429) {
          const retryAfter = errorData.retryAfter || 60;
          alert(`Discord API rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
          return;
        }
        
        console.error('Failed to add new role');
        return;
      }

      // Update the staff roster with new role
      setStaffRoster(prev => prev.map(member => 
        member.id === editingMember.id 
          ? { ...member, rank: editingStaffData.rank }
          : member
      ));
      
      // Update the editing member
      setEditingMember({ ...editingMember, rank: editingStaffData.rank });
    } catch (error) {
      console.error('Error changing role:', error);
    } finally {
      setIsChangingRole(false);
    }
  };

  const handleRemoveStaffFromEdit = () => {
    setShowRemoveConfirm(true);
  };

  const confirmRemoveFromEdit = async () => {
    if (!editingMember || !removeReason.trim()) return;
    
    setIsRemovingStaff(true);
    try {
      const token = localStorage.getItem('staffToken');
      if (!token) {
        console.error('No staff token found');
        return;
      }

      // Remove the role from Discord
      const removeResponse = await fetch('/api/staff/remove-role', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: editingMember.id,
          roleName: editingMember.rank
        })
      });

      if (!removeResponse.ok) {
        const errorData = await removeResponse.json().catch(() => ({}));
        
        if (removeResponse.status === 429) {
          const retryAfter = errorData.retryAfter || 60;
          alert(`Discord API rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
          return;
        }
        
        console.error('Failed to remove staff member');
        return;
      }

      // Add to past staff in database
      const addPastStaffResponse = await fetch('/api/staff/add-past-staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          discordId: editingMember.id,
          username: editingMember.username,
          displayName: editingMember.displayName,
          rank: editingMember.rank,
          playfabId: editingMember.playfabId || '',
          recruitmentDate: editingMember.recruitmentDate || '',
          removalReason: removeReason.trim()
        })
      });

      if (!addPastStaffResponse.ok) {
        throw new Error(`Failed to add to past staff: ${addPastStaffResponse.status}`);
      }

      // Clear the backend cache to ensure fresh data
      const clearCacheResponse = await fetch('/api/staff/clear-cache', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

              if (!clearCacheResponse.ok) {
          console.warn('Failed to clear cache, but continuing...');
        }

        // Add a small delay to ensure Discord has processed the role changes
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Reload staff roster to get updated data
        await loadStaffRoster();
      
      // Close all modals
      setShowEditStaffModal(false);
      setShowRemoveConfirm(false);
      setEditingMember(null);
      setEditingStaffData({ playfabId: '', recruitmentDate: '', rank: 'Admin', status: 'Active' });
      setRemoveReason('');
      alert('Staff member removed successfully');
    } catch (error) {
      console.error('Error removing staff member:', error);
      alert('Failed to remove staff member. Please check bot permissions.');
    } finally {
      setIsRemovingStaff(false);
    }
  };



  // const handleRemoveStaff = (member: StaffMember) => {
  //   setRemovingMember(member);
  //   setShowRemoveStaffModal(true);
  // };

  const handleEditPastStaff = (member: PastStaffMember) => {
    setEditingPastMember(member);
    setEditingPastStaffData({
      name: member.name,
      rank: member.rank as 'Founder' | 'Management' | 'Admin',
      playfabID: member.playfabID,
      recruitmentDate: member.recruitmentDate,
      removalReason: member.removalReason
    });
    setShowEditPastStaffModal(true);
  };

  const handleRemovePastStaff = (member: PastStaffMember) => {
    setRemovingPastMember(member);
    setShowRemovePastStaffModal(true);
  };

  const confirmRemoveStaff = async () => {
    if (removingMember && removeReason.trim()) {
      try {
        const token = localStorage.getItem('staffToken');
        if (!token) {
          console.error('No staff token found');
          return;
        }

        // Remove the role from Discord
        const removeResponse = await fetch('/api/staff/remove-role', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId: removingMember.id,
            roleName: removingMember.rank
          })
        });

        if (!removeResponse.ok) {
          const errorData = await removeResponse.json().catch(() => ({}));
          
          if (removeResponse.status === 429) {
            const retryAfter = errorData.retryAfter || 60;
            alert(`Discord API rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
            return;
          }
          
          throw new Error(`Failed to remove role: ${removeResponse.status}`);
        }

        // Add to past staff in database
        const addPastStaffResponse = await fetch('/api/staff/add-past-staff', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            discordId: removingMember.id,
            username: removingMember.username,
            displayName: removingMember.displayName,
            rank: removingMember.rank,
            playfabId: removingMember.playfabId || '',
            recruitmentDate: removingMember.recruitmentDate || '',
            removalReason: removeReason.trim()
          })
        });

        if (!addPastStaffResponse.ok) {
          throw new Error(`Failed to add to past staff: ${addPastStaffResponse.status}`);
        }

        // Clear the backend cache to ensure fresh data
        const clearCacheResponse = await fetch('/api/staff/clear-cache', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!clearCacheResponse.ok) {
          console.warn('Failed to clear cache, but continuing...');
        }

        // Add a small delay to ensure Discord has processed the role changes
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Reload staff roster to get updated data
        await loadStaffRoster();
        
        setShowRemoveStaffModal(false);
        setRemovingMember(null);
        setRemoveReason('');
        alert('Staff member removed successfully');
      } catch (error) {
        console.error('Error removing staff member:', error);
        alert('Failed to remove staff member. Please check bot permissions.');
      }
    }
  };

  const handleSavePastStaff = async () => {
    if (!editingPastMember) return;
    
    setIsSavingPastStaff(true);
    try {
      const token = localStorage.getItem('staffToken');
      if (!token) {
        console.error('No staff token found');
        return;
      }

      const response = await fetch('/api/staff/update-past-staff', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          discordId: editingPastMember.id,
          username: editingPastMember.name, // Using name as username for past staff
          displayName: editingPastStaffData.name,
          rank: editingPastStaffData.rank,
          playfabId: editingPastStaffData.playfabID,
          recruitmentDate: editingPastStaffData.recruitmentDate,
          removalReason: editingPastStaffData.removalReason
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update past staff: ${response.status}`);
      }

      // Reload staff roster to get updated data
      await loadStaffRoster();
      
      setShowEditPastStaffModal(false);
      setEditingPastMember(null);
      setEditingPastStaffData({ name: '', rank: 'Admin', playfabID: '', recruitmentDate: '', removalReason: '' });
      alert('Past staff member updated successfully');
    } catch (error) {
      console.error('Error updating past staff member:', error);
      alert('Failed to update past staff member.');
    } finally {
      setIsSavingPastStaff(false);
    }
  };

  const confirmRemovePastStaff = async () => {
    if (removingPastMember) {
      try {
        const token = localStorage.getItem('staffToken');
        if (!token) {
          console.error('No staff token found');
          return;
        }

        // Remove from past staff in database
        const removeResponse = await fetch('/api/staff/remove-past-staff', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            discordId: removingPastMember.id
          })
        });

        if (!removeResponse.ok) {
          throw new Error(`Failed to remove past staff: ${removeResponse.status}`);
        }

        // Reload staff roster to get updated data
        await loadStaffRoster();
        
        setShowRemovePastStaffModal(false);
        setRemovingPastMember(null);
        alert('Past staff member removed successfully');
      } catch (error) {
        console.error('Error removing past staff member:', error);
        alert('Failed to remove past staff member.');
      }
    }
  };

  const getRankOrder = (rank: string): number => {
    switch (rank) {
      case 'Founder': return 1;
      case 'Management': return 2;
      case 'Admin': return 3;
      default: return 4;
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Founder': return 'text-purple-400';
      case 'Management': return 'text-blue-400';
      case 'Admin': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'Founder': return 'text-purple-400';
      case 'Management': return 'text-blue-400';
      case 'Admin': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 
      'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-orange-500'
    ];
    const index = category.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Export PlayFab IDs functions
  const exportAllPlayFabIds = () => {
    const playfabIds = staffRoster
      .filter(member => member.playfabId && member.playfabId.trim() !== '')
      .map(member => member.playfabId.trim());
    
    if (playfabIds.length === 0) {
      alert('No PlayFab IDs found in the roster.');
      return;
    }
    
    const content = playfabIds.join('\n');
    downloadTextFile(content, 'all_playfab_ids.txt');
  };

  const exportManagementPlayFabIds = () => {
    const playfabIds = staffRoster
      .filter(member => 
        (member.rank === 'Founder' || member.rank === 'Management') && 
        member.playfabId && 
        member.playfabId.trim() !== ''
      )
      .map(member => member.playfabId.trim());
    
    if (playfabIds.length === 0) {
      alert('No PlayFab IDs found for Management+ staff.');
      return;
    }
    
    const content = playfabIds.join('\n');
    downloadTextFile(content, 'management_playfab_ids.txt');
  };

  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Discord Stats functions
  const loadDiscordData = async () => {
    setIsLoadingDiscordData(true);
    try {
      const token = localStorage.getItem('staffToken');
      if (!token) {
        console.error('No staff token found');
        return;
      }
      const [statsResponse, activityResponse, logsResponse] = await Promise.all([
        fetch('/api/discord-stats/server-stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/discord-stats/recent-activity', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/discord-stats/moderation-logs', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);
      


      if (statsResponse.ok && activityResponse.ok && logsResponse.ok) {
        const statsData = await statsResponse.json();
        const activityData = await activityResponse.json();
        const logsData = await logsResponse.json();
        
        setDiscordStats(statsData);
        setRecentActivity(activityData);
        setModerationLogs(logsData);
      } else {
        console.error('Failed to fetch Discord data');
        if (!statsResponse.ok) {
          const errorData = await statsResponse.json().catch(() => ({}));
          console.error('Server stats error:', errorData);
        }
        if (!activityResponse.ok) {
          const errorData = await activityResponse.json().catch(() => ({}));
          console.error('Activity error:', errorData);
        }
        if (!logsResponse.ok) {
          const errorData = await logsResponse.json().catch(() => ({}));
          console.error('Logs error:', errorData);
        }
      }
    } catch (error) {
      console.error('Error loading Discord data:', error);
    } finally {
      setIsLoadingDiscordData(false);
    }
  };

  // Staff Info functions
  const loadDocuments = async () => {
    try {
      const token = localStorage.getItem('staffToken');
      if (!token) {
        console.error('No staff token found');
        return;
      }

      const [documentsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/staff-documents', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/staff-documents/categories/list', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (documentsResponse.ok && categoriesResponse.ok) {
        const documentsData = await documentsResponse.json();
        const categoriesData = await categoriesResponse.json();
        setDocuments(documentsData);
        setCategories(categoriesData);
      } else {
        console.error('Failed to fetch documents or categories');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleCreateDocument = () => {
    setDocumentForm({
      title: '',
      content: '',
      category: 'general',
      access_level: 'Admin'
    });
    setShowCreateDocumentModal(true);
  };

  const handleEditDocument = (document: any) => {
    setSelectedDocument(document);
    setDocumentForm({
      title: document.title,
      content: document.content,
      category: document.category,
      access_level: document.access_level
    });
    setShowEditDocumentModal(true);
  };

  const handleViewDocument = (document: any) => {
    setSelectedDocument(document);
    setShowViewDocumentModal(true);
  };

  const handleDeleteDocument = (document: any) => {
    setDeletingDocument(document);
    setShowDeleteDocumentModal(true);
  };

  const handleSaveDocument = async () => {
    if (!documentForm.title.trim() || !documentForm.content.trim()) {
      alert('Title and content are required');
      return;
    }

    setIsSavingDocument(true);
    try {
      const token = localStorage.getItem('staffToken');
      if (!token) {
        console.error('No staff token found');
        return;
      }

      const url = showEditDocumentModal 
        ? `/api/staff-documents/${selectedDocument.id}`
        : '/api/staff-documents';
      
      const method = showEditDocumentModal ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(documentForm)
      });

      if (response.ok) {
        await loadDocuments();
        setShowCreateDocumentModal(false);
        setShowEditDocumentModal(false);
        setSelectedDocument(null);
        setDocumentForm({ title: '', content: '', category: 'general', access_level: 'Admin' });
        alert(showEditDocumentModal ? 'Document updated successfully' : 'Document created successfully');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to save document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Failed to save document');
    } finally {
      setIsSavingDocument(false);
    }
  };

  const confirmDeleteDocument = async () => {
    if (!deletingDocument) return;

    try {
      const token = localStorage.getItem('staffToken');
      if (!token) {
        console.error('No staff token found');
        return;
      }

      const response = await fetch(`/api/staff-documents/${deletingDocument.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadDocuments();
        setShowDeleteDocumentModal(false);
        setDeletingDocument(null);
        alert('Document deleted successfully');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const filteredDocuments = documents.filter(doc => 
    selectedCategory === 'all' || doc.category === selectedCategory
  );

  const sortedStaffRoster = [...staffRoster].sort((a, b) => {
    // First sort by rank
    const rankComparison = getRankOrder(a.rank) - getRankOrder(b.rank);
    if (rankComparison !== 0) {
      return rankComparison;
    }
    // If ranks are the same, sort alphabetically by display name
    return a.displayName.localeCompare(b.displayName);
  });

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
                {activePanel ? `${activePanel.charAt(0).toUpperCase() + activePanel.slice(1).replace('-', ' ').replace('roster', 'Roster')}` : (window.location.pathname === '/staff' ? 'Staff Dashboard' : 'Admin Dashboard')}
              </h1>
              <p className="text-gray-300 text-sm">
                Welcome, {user.username} • {getUserRoleName(user)}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {activePanel && (
                <button
                  onClick={handleBackToDashboard}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  Back to Dashboard
                </button>
              )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activePanel === 'staff-roster' ? (
          <StaffRosterPanel 
            staffRoster={sortedStaffRoster}
            pastStaff={pastStaff}
            canEdit={hasPermission(2)} // Management level and up
            onEditStaff={handleEditStaff}
            onAddStaff={handleAddStaff}
            onEditPastStaff={handleEditPastStaff}
            onRemovePastStaff={handleRemovePastStaff}
            onRefreshRoster={loadStaffRoster}
            searchQuery={searchQuery}
            searchResults={searchResults}
            isSearching={isSearching}
            selectedRole={selectedRole}
            isAddingRole={isAddingRole}
            onSearchChange={handleSearchChange}
            onAddRole={addRoleToUser}
            onRoleChange={setSelectedRole}
            showAddStaffModal={showAddStaffModal}
            onExportAllPlayFabIds={exportAllPlayFabIds}
            onExportManagementPlayFabIds={exportManagementPlayFabIds}
            exportDropdownRef={exportDropdownRef}
            showExportDropdown={showExportDropdown}
            setShowExportDropdown={setShowExportDropdown}
          />

        ) : activePanel === 'staff-info' ? (
          <StaffInfoPanel
            documents={filteredDocuments}
            categories={categories}
            selectedCategory={selectedCategory}
            canEdit={hasPermission(2)} // Management level and up
            onCreateDocument={handleCreateDocument}
            onEditDocument={handleEditDocument}
            onViewDocument={handleViewDocument}
            onDeleteDocument={handleDeleteDocument}
            onCategoryChange={setSelectedCategory}
            onRefreshDocuments={loadDocuments}
            getCategoryColor={getCategoryColor}
            getAccessLevelColor={getAccessLevelColor}
          />

        ) : activePanel === 'discord' ? (
          <div className="glass p-6 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Discord Moderation</h2>
                <p className="text-gray-300">Review logs and moderate the Discord server</p>
              </div>
              {isLoadingDiscordData && (
                <div className="flex items-center text-cyan-400">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400 mr-2"></div>
                  Loading...
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="glass p-4 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {isLoadingDiscordData ? (
                    <div className="text-sm text-gray-400">Loading activity...</div>
                  ) : recentActivity.length > 0 ? (
                    recentActivity.slice(0, 3).map((activity) => (
                      <div key={activity.id} className="text-sm text-gray-300">
                        <span className="text-cyan-400">[{new Date(activity.timestamp).toLocaleTimeString()}]</span> {activity.details}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-400">No recent activity</div>
                  )}
                </div>
              </div>

              {/* Moderation Actions */}
              <div className="glass p-4 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors">
                    Ban User
                  </button>
                  <button className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors">
                    Timeout User
                  </button>
                  <button className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">
                    View Logs
                  </button>
                </div>
              </div>

              {/* Server Stats */}
              <div className="glass p-4 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">Server Stats</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  {isLoadingDiscordData ? (
                    <div className="text-gray-400">Loading stats...</div>
                  ) : discordStats ? (
                    <>
                      <div>Online Members: <span className="text-green-400">{discordStats.onlineMembers}</span></div>
                      <div>Total Members: <span className="text-blue-400">{discordStats.totalMembers}</span></div>
                      <div>Active Channels: <span className="text-purple-400">{discordStats.activeChannels}</span></div>
                      {discordStats.boostLevel > 0 && (
                        <div>Boost Level: <span className="text-pink-400">Level {discordStats.boostLevel}</span></div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-400">
                      Failed to load stats
                      <div className="text-xs text-gray-500 mt-1">
                        Check Discord bot configuration
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Moderation Logs</h3>
              <div className="glass border border-white/10 rounded-lg overflow-hidden">
                <div className="bg-gray-800 px-4 py-3 border-b border-gray-600">
                  <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-300">
                    <div>Time</div>
                    <div>Action</div>
                    <div>Moderator</div>
                    <div>User</div>
                    <div>Reason</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-600">
                  {isLoadingDiscordData ? (
                    <div className="px-4 py-3 text-center text-gray-400">Loading logs...</div>
                  ) : moderationLogs.length > 0 ? (
                    moderationLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="px-4 py-3 grid grid-cols-5 gap-4 text-sm">
                        <div className="text-gray-300">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                        <div className={`${
                          log.action === 'ban' ? 'text-red-400' :
                          log.action === 'timeout' ? 'text-yellow-400' :
                          log.action === 'warning' ? 'text-green-400' :
                          log.action === 'kick' ? 'text-orange-400' :
                          'text-gray-400'
                        } capitalize`}>
                          {log.action}
                        </div>
                        <div className="text-white">{log.moderator}</div>
                        <div className="text-white">{log.user}</div>
                        <div className="text-gray-400">{log.reason}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-gray-400">No moderation logs found</div>
                  )}
                </div>
              </div>
            </div>
          </div>

        ) : (
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
                  <button 
                    onClick={() => handlePanelClick(section.id)}
                    className={`w-full ${section.buttonColor} text-white py-2 px-4 rounded-lg transition-colors duration-200`}
                  >
                  {section.buttonText}
                </button>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Remove Staff Modal */}
      {showRemoveStaffModal && removingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Remove Staff Member</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to remove <span className="text-cyan-300">{removingMember.displayName}</span> from the staff roster?
            </p>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-2">Removal Reason *</label>
              <textarea
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
                placeholder="Enter the reason for removal..."
                rows={3}
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRemoveStaffModal(false);
                  setRemovingMember(null);
                  setRemoveReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveStaff}
                disabled={!removeReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Past Staff Modal */}
      {showRemovePastStaffModal && removingPastMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Delete Past Staff Member</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to permanently delete <span className="text-cyan-300">{removingPastMember.name}</span> from the past staff records?
            </p>
            <p className="text-red-400 text-sm mb-4">
              This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRemovePastStaffModal(false);
                  setRemovingPastMember(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemovePastStaff}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Document Modal */}
      {(showCreateDocumentModal || showEditDocumentModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass p-6 rounded-xl border border-white/10 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-4">
              {showCreateDocumentModal ? 'Create New Document' : 'Edit Document'}
            </h3>
            
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">Title *</label>
                <input
                  type="text"
                  value={documentForm.title}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter document title..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">Category</label>
                <input
                  type="text"
                  value={documentForm.category}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Enter category (e.g., guidelines, procedures, policies)..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Access Level */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">Access Level</label>
                <select
                  value={documentForm.access_level}
                  onChange={(e) => setDocumentForm(prev => ({ ...prev, access_level: e.target.value as 'Admin' | 'Management' | 'Founder' }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Admin">Admin</option>
                  <option value="Management">Management</option>
                  <option value="Founder">Founder</option>
                </select>
              </div>

              {/* Content */}
              <div>
                <label className="block text-gray-300 text-sm mb-2">Content *</label>
                <RichTextEditor
                  value={documentForm.content}
                  onChange={(content) => setDocumentForm(prev => ({ ...prev, content }))}
                  placeholder="Start writing your document..."
                  className="min-h-[300px]"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateDocumentModal(false);
                  setShowEditDocumentModal(false);
                  setSelectedDocument(null);
                  setDocumentForm({ title: '', content: '', category: 'general', access_level: 'Admin' });
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDocument}
                disabled={isSavingDocument || !documentForm.title.trim() || !documentForm.content.trim()}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
              >
                {isSavingDocument ? 'Saving...' : (showCreateDocumentModal ? 'Create Document' : 'Update Document')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {showViewDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass p-6 rounded-xl border border-white/10 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-white">{selectedDocument.title}</h3>
              <button
                onClick={() => {
                  setShowViewDocumentModal(false);
                  setSelectedDocument(null);
                }}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4 flex items-center gap-4 text-sm text-gray-300">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedDocument.category)} text-white`}>
                {selectedDocument.category}
              </span>
              <span className={`text-xs font-medium ${getAccessLevelColor(selectedDocument.access_level)}`}>
                {selectedDocument.access_level}
              </span>
              <span>By {selectedDocument.author_name}</span>
              <span>{new Date(selectedDocument.updated_at).toLocaleDateString()}</span>
            </div>
            
            <div 
              className="prose prose-invert max-w-none text-gray-300"
              dangerouslySetInnerHTML={{ __html: selectedDocument.content }}
            />
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowViewDocumentModal(false);
                  setSelectedDocument(null);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Document Modal */}
      {showDeleteDocumentModal && deletingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Delete Document</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to permanently delete <span className="text-cyan-300">{deletingDocument.title}</span>?
            </p>
            <p className="text-red-400 text-sm mb-4">
              This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteDocumentModal(false);
                  setDeletingDocument(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDocument}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Member Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass p-6 rounded-xl border border-white/10 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Add Staff Member</h3>
            
            {/* Search Input */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-2">Search Guild Members</label>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by username, display name, or ID..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Role Selection */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-2">Select Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'Founder' | 'Management' | 'Admin')}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="Admin">Admin</option>
                <option value="Management">Management</option>
                <option value="Founder">Founder</option>
              </select>
            </div>

            {/* Search Results */}
            {isSearching && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400 mx-auto"></div>
                <p className="text-gray-300 mt-2">Searching...</p>
              </div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2">Select User</label>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {searchResults.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer"
                      onClick={() => addRoleToUser(member.id, selectedRole)}
                    >
                      <div className="flex items-center">
                        {member.avatar && (
                          <img 
                            src={member.avatar} 
                            alt={member.displayName} 
                            className="w-8 h-8 rounded-full mr-3"
                          />
                        )}
                        <div>
                          <p className="text-white font-medium">{member.displayName}</p>
                          <p className="text-gray-400 text-sm">@{member.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addRoleToUser(member.id, selectedRole);
                        }}
                        disabled={isAddingRole}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm disabled:opacity-50"
                      >
                        {isAddingRole ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-400">No users found matching "{searchQuery}"</p>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleAddStaff}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Member Modal */}
      {showEditStaffModal && editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass p-6 rounded-xl border border-white/10 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Edit Staff Member</h3>
            
            <div className="mb-4">
              <div className="flex items-center mb-3">
                {editingMember.avatar && (
                  <img 
                    src={editingMember.avatar} 
                    alt={editingMember.displayName} 
                    className="w-10 h-10 rounded-full mr-3"
                  />
                )}
                <div>
                  <p className="text-white font-medium">{editingMember.displayName}</p>
                  <p className="text-gray-400 text-sm">@{editingMember.username}</p>
                  <p className={`text-sm ${getRankColor(editingMember.rank)}`}>{editingMember.rank}</p>
                </div>
              </div>
            </div>

            {/* PlayFab ID */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-2">PlayFab ID</label>
              <input
                type="text"
                value={editingStaffData.playfabId}
                onChange={(e) => setEditingStaffData(prev => ({ ...prev, playfabId: e.target.value }))}
                placeholder="Enter PlayFab ID..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              />
            </div>



            {/* Role Selection */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-2">Role</label>
              <select
                value={editingStaffData.rank}
                onChange={(e) => setEditingStaffData(prev => ({ ...prev, rank: e.target.value as 'Founder' | 'Management' | 'Admin' }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="Admin">Admin</option>
                <option value="Management">Management</option>
                <option value="Founder">Founder</option>
              </select>
            </div>

            {/* Status Selection */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-2">Status</label>
              <select
                value={editingStaffData.status}
                onChange={(e) => setEditingStaffData(prev => ({ ...prev, status: e.target.value as 'Active' | 'Exempt' | 'Inactive' | 'On Leave' }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="Active">Active</option>
                <option value="Exempt">Exempt</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

            {/* Recruitment Date */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-2">Recruitment Date</label>
              <input
                type="date"
                value={editingStaffData.recruitmentDate}
                onChange={(e) => setEditingStaffData(prev => ({ ...prev, recruitmentDate: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowEditStaffModal(false);
                    setEditingMember(null);
                    setEditingStaffData({ playfabId: '', recruitmentDate: '', rank: 'Admin', status: 'Active' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStaff}
                  disabled={isSavingStaff}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                >
                  {isSavingStaff ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
              
              {/* Role and Remove Actions */}
              <div className="flex space-x-3">
                {editingStaffData.rank !== editingMember.rank && (
                  <button
                    onClick={handleChangeRole}
                    disabled={isChangingRole}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                  >
                    {isChangingRole ? 'Changing Role...' : `Change to ${editingStaffData.rank}`}
                  </button>
                )}
                <button
                  onClick={handleRemoveStaffFromEdit}
                  disabled={isRemovingStaff}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                >
                  Remove Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Past Staff Modal */}
      {showEditPastStaffModal && editingPastMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass p-6 rounded-xl border border-white/10 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Edit Past Staff Member</h3>
            
            <div className="mb-4">
              <div className="flex items-center mb-3">
                <div>
                  <p className="text-white font-medium">{editingPastMember.name}</p>
                  <p className={`text-sm ${getRankColor(editingPastMember.rank)}`}>{editingPastMember.rank}</p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-2">Display Name</label>
              <input
                type="text"
                value={editingPastStaffData.name}
                onChange={(e) => setEditingPastStaffData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter display name..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* PlayFab ID */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-2">PlayFab ID</label>
              <input
                type="text"
                value={editingPastStaffData.playfabID}
                onChange={(e) => setEditingPastStaffData(prev => ({ ...prev, playfabID: e.target.value }))}
                placeholder="Enter PlayFab ID..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Role Selection */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-2">Role</label>
              <select
                value={editingPastStaffData.rank}
                onChange={(e) => setEditingPastStaffData(prev => ({ ...prev, rank: e.target.value as 'Founder' | 'Management' | 'Admin' }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="Admin">Admin</option>
                <option value="Management">Management</option>
                <option value="Founder">Founder</option>
              </select>
            </div>

            {/* Recruitment Date */}
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-2">Recruitment Date</label>
              <input
                type="date"
                value={editingPastStaffData.recruitmentDate}
                onChange={(e) => setEditingPastStaffData(prev => ({ ...prev, recruitmentDate: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Removal Reason */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-2">Removal Reason</label>
              <textarea
                value={editingPastStaffData.removalReason}
                onChange={(e) => setEditingPastStaffData(prev => ({ ...prev, removalReason: e.target.value }))}
                placeholder="Enter removal reason..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowEditPastStaffModal(false);
                  setEditingPastMember(null);
                  setEditingPastStaffData({ name: '', rank: 'Admin', playfabID: '', recruitmentDate: '', removalReason: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePastStaff}
                disabled={isSavingPastStaff}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
              >
                {isSavingPastStaff ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="glass p-6 rounded-xl border border-white/10 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Remove Staff Member</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to remove <span className="text-cyan-300">{editingMember.displayName}</span> from the staff roster?
            </p>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm mb-2">Removal Reason *</label>
              <textarea
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
                placeholder="Enter the reason for removal..."
                rows={3}
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRemoveConfirm(false);
                  setRemoveReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveFromEdit}
                disabled={!removeReason.trim() || isRemovingStaff}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
              >
                {isRemovingStaff ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Staff Roster Panel Component
const StaffRosterPanel: React.FC<{
  staffRoster: StaffMember[];
  pastStaff: PastStaffMember[];
  canEdit: boolean;
  onEditStaff: (member: StaffMember) => void;
  onAddStaff: () => void;
  onEditPastStaff: (member: PastStaffMember) => void;
  onRemovePastStaff: (member: PastStaffMember) => void;
  onRefreshRoster: () => void;
  searchQuery: string;
  searchResults: any[];
  isSearching: boolean;
  selectedRole: string;
  isAddingRole: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddRole: (userId: string, roleName: string) => void;
  onRoleChange: (role: 'Founder' | 'Management' | 'Admin') => void;
  showAddStaffModal: boolean;
  onExportAllPlayFabIds: () => void;
  onExportManagementPlayFabIds: () => void;
  exportDropdownRef: React.RefObject<HTMLDivElement | null>;
  showExportDropdown: boolean;
  setShowExportDropdown: (show: boolean) => void;
}> = ({ 
  staffRoster, 
  pastStaff, 
  canEdit, 
  onEditStaff, 
  onAddStaff, 
  onEditPastStaff, 
  onRemovePastStaff,
  onRefreshRoster,
  searchQuery,
  searchResults,
  isSearching,
  selectedRole,
  isAddingRole,
  onSearchChange,
  onAddRole,
  onRoleChange,
  showAddStaffModal,
  onExportAllPlayFabIds,
  onExportManagementPlayFabIds,
  exportDropdownRef,
  showExportDropdown,
  setShowExportDropdown
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-400';
      case 'Exempt': return 'text-blue-400';
      case 'Inactive': return 'text-red-400';
      case 'On Leave': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Founder': return 'text-purple-400';
      case 'Management': return 'text-blue-400';
      case 'Admin': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

    // Debug logging
  
  
  return (
    <div className="space-y-8">
      {/* Current Staff Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            Current Staff Roster <span className="text-cyan-400 text-lg font-semibold">({staffRoster.length})</span>
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={onRefreshRoster}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="relative" ref={exportDropdownRef}>
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showExportDropdown && (
                <div className="absolute right-0 mt-1 w-64 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onExportAllPlayFabIds();
                        setShowExportDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export All IDs
                    </button>
                    <button
                      onClick={() => {
                        onExportManagementPlayFabIds();
                        setShowExportDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export Mgmt IDs
                    </button>
                  </div>
                </div>
              )}
            </div>
            {canEdit && (
              <button
                onClick={onAddStaff}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
              >
                Add Staff Member
              </button>
            )}
          </div>
        </div>

        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rank</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">PlayFab ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Recruitment</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  {canEdit && (
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {staffRoster.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-800/50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`font-medium ${getRankColor(member.rank)}`}>
                        {member.rank}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        {member.avatar && (
                          <img
                            src={member.avatar}
                            alt={member.displayName}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                        )}
                        <span className="text-white text-sm">{member.displayName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-300 font-mono text-xs">
                      {member.playfabId}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-300 text-sm">
                      {member.recruitmentDate || 'N/A'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`text-sm ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onEditStaff(member)}
                            className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Past Staff Section */}
      {(() => {
    
        return null;
      })()}
      {pastStaff.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Past Staff Members</h2>
          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rank</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">PlayFab ID</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Recruitment</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Removal</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reason</th>
                    {canEdit && (
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {pastStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-800/50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`font-medium ${getRankColor(member.rank)}`}>
                          {member.rank}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-300 text-sm">
                        {member.name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-300 font-mono text-xs">
                        {member.playfabID}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-300 text-sm">
                        {member.recruitmentDate}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-300 text-sm">
                        {member.removalDate}
                      </td>
                      <td className="px-3 py-2 text-gray-300 max-w-64 truncate text-sm">
                        {member.removalReason}
                      </td>
                      {canEdit && (
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => onEditPastStaff(member)}
                              className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onRemovePastStaff(member)}
                              className="text-red-400 hover:text-red-300 transition-colors duration-200 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Staff Info Panel Component
const StaffInfoPanel: React.FC<{
  documents: any[];
  categories: string[];
  selectedCategory: string;
  canEdit: boolean;
  onCreateDocument: () => void;
  onEditDocument: (document: any) => void;
  onViewDocument: (document: any) => void;
  onDeleteDocument: (document: any) => void;
  onCategoryChange: (category: string) => void;
  onRefreshDocuments: () => void;
  getCategoryColor: (category: string) => string;
  getAccessLevelColor: (level: string) => string;
}> = ({ 
  documents, 
  categories, 
  selectedCategory, 
  canEdit, 
  onCreateDocument, 
  onEditDocument, 
  onViewDocument,
  onDeleteDocument, 
  onCategoryChange, 
  onRefreshDocuments,
  getCategoryColor,
  getAccessLevelColor
}) => {

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Staff Information Documents</h2>
        <div className="flex gap-2">
          <button
            onClick={onRefreshDocuments}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
            title="Refresh Documents"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {canEdit && (
            <button
              onClick={onCreateDocument}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
            >
              Create Document
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
            selectedCategory === 'all' 
              ? 'bg-cyan-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          All Categories
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
              selectedCategory === category 
                ? 'bg-cyan-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">
            {selectedCategory === 'all' ? 'No documents found' : `No documents in "${selectedCategory}" category`}
          </div>
          <p className="text-gray-500">
            {canEdit ? 'Create your first document to get started.' : 'Documents will appear here once they are created.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((document) => (
            <div 
              key={document.id} 
              className="glass p-6 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-colors duration-200 cursor-pointer"
              onClick={() => onViewDocument(document)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(document.category)} text-white`}>
                    {document.category}
                  </span>
                  <span className={`text-xs font-medium ${getAccessLevelColor(document.access_level)}`}>
                    {document.access_level}
                  </span>
                </div>
                {canEdit && (
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onEditDocument(document)}
                      className="p-1 text-gray-400 hover:text-cyan-400 transition-colors duration-200"
                      title="Edit Document"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDeleteDocument(document)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors duration-200"
                      title="Delete Document"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{document.title}</h3>
              
              <div 
                className="text-gray-300 text-sm mb-4 line-clamp-3"
                dangerouslySetInnerHTML={{ __html: document.content }}
              />
              
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>By {document.author_name}</span>
                <span>{new Date(document.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin; 