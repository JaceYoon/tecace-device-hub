
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';

import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import DeviceManagement from './pages/DeviceManagement';
import UserManagement from './pages/UserManagement';
import ProfilePage from './pages/ProfilePage';
import Navbar from './components/layout/Navbar';
import { AuthProvider } from './components/auth/AuthProvider';
import { ThemeProvider } from 'next-themes';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <div className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/device-management" element={<DeviceManagement />} />
                  <Route path="/user-management" element={<UserManagement />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/login" element={<Index />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <Toaster position="top-right" />
            </div>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
