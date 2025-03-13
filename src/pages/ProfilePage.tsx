
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import ProfileEditor from '@/components/profile/ProfileEditor';

const ProfilePage: React.FC = () => {
  return (
    <PageContainer>
      <div className="py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Profile Settings</h1>
        <ProfileEditor />
      </div>
    </PageContainer>
  );
};

export default ProfilePage;
