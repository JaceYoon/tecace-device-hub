
import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { initDialogButtonSpacing } from './utils/dialogHelper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';

// Create a client
const queryClient = new QueryClient();

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="app-container">
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
    </QueryClientProvider>
  );
};

export default App;
