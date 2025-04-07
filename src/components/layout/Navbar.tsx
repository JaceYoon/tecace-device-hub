
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Monitor, Users, Package, LogOut, User, Cpu, RotateCcw } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import ThemeToggle from '../ui/theme-toggle';

const Navbar = () => {
  const location = useLocation();
  const { logout, isAdmin, isManager } = useAuth();

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
            
            <NavLink to="/device-management">
              <Button 
                variant={isActive('/device-management') ? 'default' : 'ghost'} 
                className="flex items-center"
              >
                <Package className="h-4 w-4 mr-2" />
                Devices
              </Button>
            </NavLink>
            
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
              <User className="h-4 w-4 mr-2" />
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
