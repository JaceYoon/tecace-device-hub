
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/components/auth/AuthProvider';
import Dashboard from '@/pages/Dashboard';
import DeviceManagement from '@/pages/DeviceManagement';
import UserManagement from '@/pages/UserManagement';
import DeviceReturnsPage from '@/pages/DeviceReturnsPage';
import DeviceHistoryPage from '@/pages/DeviceHistoryPage';
import ProfilePage from '@/pages/ProfilePage';
import LoginPage from '@/components/auth/LoginPage';
import NotFound from '@/pages/NotFound';
import DashboardPage from '@/pages/DashboardPage';
import { Navbar } from '@/components/layout/Navbar';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Router>
          <AuthProvider>
            <div className="min-h-screen bg-background">
              <Navbar />
              <main className="pt-16">
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/devices" element={<DeviceManagement />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/returns" element={<DeviceReturnsPage />} />
                  <Route path="/history" element={<DeviceHistoryPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Toaster />
            </div>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
