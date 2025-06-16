
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Monitor, Users, Package, LogOut, User, Cpu, RotateCcw, Info, History } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { ThemeToggle } from '../ui/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { VERSION } from '@/constants/version';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const Navbar = () => {
  const location = useLocation();
  const { logout, isAdmin, user } = useAuth();
  const isDevMode = process.env.NODE_ENV === 'development';

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        <div className="flex items-center">
          <NavLink to="/dashboard" className="flex items-center mr-6">
            <Cpu className="h-6 w-6 mr-2 text-primary" />
            <span className="text-xl font-semibold">TecAce</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn(
                    "ml-2 text-xs px-1.5 py-0.5 rounded",
                    isDevMode ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100" : 
                              "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                  )}>
                    v{VERSION}{isDevMode ? " (Dev)" : ""}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tecace Device Management System v{VERSION}</p>
                  <p>{isDevMode ? "Development Mode" : "Production Mode"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </NavLink>
          
          <div className="hidden md:flex space-x-1">
            <NavLink to="/dashboard">
              <Button 
                variant={isActive('/dashboard') ? 'default' : 'ghost'} 
                className="flex items-center"
              >
                <Monitor className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </NavLink>
            
            {isAdmin && (
              <NavLink to="/device-management">
                <Button 
                  variant={isActive('/device-management') ? 'default' : 'ghost'} 
                  className="flex items-center"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Devices
                </Button>
              </NavLink>
            )}
            
            {isAdmin && (
              <NavLink to="/device-returns">
                <Button 
                  variant={isActive('/device-returns') ? 'default' : 'ghost'} 
                  className="flex items-center"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Returns
                </Button>
              </NavLink>
            )}

            <NavLink to="/history">
              <Button 
                variant={isActive('/history') ? 'default' : 'ghost'} 
                className="flex items-center"
              >
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
            </NavLink>
            
            {isAdmin && (
              <NavLink to="/user-management">
                <Button 
                  variant={isActive('/user-management') ? 'default' : 'ghost'} 
                  className="flex items-center"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </Button>
              </NavLink>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          
          <NavLink to="/profile">
            <Button 
              variant={isActive('/profile') ? 'default' : 'ghost'} 
              className="flex items-center"
            >
              {user?.avatarUrl ? (
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={user.avatarUrl} alt={user?.name || 'User'} />
                  <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              ) : (
                <User className="h-4 w-4 mr-2" />
              )}
              Profile
            </Button>
          </NavLink>
          
          <Button 
            variant="outline" 
            className="flex items-center" 
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
