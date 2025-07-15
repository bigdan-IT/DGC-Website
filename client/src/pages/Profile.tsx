import React from 'react';

const Profile: React.FC = () => {
  return (
    <div>
      <h1 className="text-4xl font-bold gradient-text mb-8" style={{ paddingTop: '80px', marginTop: '20px' }}>User Profile</h1>
      <div className="glass p-8 rounded-xl text-center">
        <p className="text-gray-300 text-lg">User profile feature coming soon!</p>
        <p className="text-gray-400 mt-2">Customize your profile, view your activity, and manage your settings.</p>
      </div>
    </div>
  );
};

export default Profile; 