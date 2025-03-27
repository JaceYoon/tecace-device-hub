
import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import Navbar from '@/components/layout/Navbar';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { initDialogButtonSpacing } from './utils/dialogHelper';
import './App.css';

// Lazy loaded pages
const Index = lazy(() => import('@/pages/Index'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const DeviceManagement = lazy(() => import('@/pages/DeviceManagement'));
const UserManagement = lazy(() => import('@/pages/UserManagement'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const App = () => {
  useEffect(() => {
    // Initialize the dialog button spacing fix
    initDialogButtonSpacing();
  }, []);

  return (
    <AuthProvider>
      <div className="app-container">
        <Navbar />
        <main>
          <Suspense fallback={<div className="loading">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/device-management" element={<DeviceManagement />} />
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Toaster />
        <SonnerToaster position="top-right" />
      </div>
    </AuthProvider>
  );
};

export default App;
