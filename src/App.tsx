
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';

import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import DeviceManagement from './pages/DeviceManagement';
import UserManagement from './pages/UserManagement';
import ProfilePage from './pages/ProfilePage';
import DeviceShippingPage from './pages/DeviceShippingPage';
import DeviceHistoryPage from './pages/DeviceHistoryPage';
import NotificationsPage from './pages/NotificationsPage';
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
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <div className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/device-management" element={<DeviceManagement />} />
                  <Route path="/device-shipping" element={<DeviceShippingPage />} />
                  <Route path="/history" element={<DeviceHistoryPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/user-management" element={<UserManagement />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/login" element={<Index />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <Toaster position="bottom-right" />
            </div>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
