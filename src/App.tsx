
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Index from './pages/Index';
import LoginPage from './components/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import DeviceManagement from './pages/DeviceManagement';
import UserManagement from './pages/UserManagement';
import NotFound from './pages/NotFound';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider } from './components/auth/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Initialize Query Client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/manage" element={<DeviceManagement />} />
            <Route path="/device-management" element={<DeviceManagement />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
      <Toaster richColors />
    </QueryClientProvider>
  );
}

export default App;
