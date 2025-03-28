
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Box, LogOut, Package, Settings, Smartphone, User } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, isManager, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="flex items-center space-x-2">
            <Box className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              TecAce Device Manager
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {isAuthenticated ? (
              <div className="flex gap-6 md:gap-2">
                <Link to="/dashboard">
                  <Button variant="ghost" className="gap-2">
                    <Smartphone className="h-[1.2rem] w-[1.2rem]" />
                    <span className="hidden md:inline-block">My Devices</span>
                  </Button>
                </Link>

                {isManager && (
                  <Link to="/device-management">
                    <Button variant="ghost" className="gap-2">
                      <Package className="h-[1.2rem] w-[1.2rem]" />
                      <span className="hidden md:inline-block">Manage Devices</span>
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div />
            )}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      {user?.avatarUrl ? (
                        <AvatarImage 
                          src={user.avatarUrl} 
                          alt={user.name} 
                          onError={(e) => {
                            console.error('Failed to load avatar image:', user.avatarUrl);
                            // Cast to HTMLImageElement to access the src property
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                          }}
                        />
                      ) : (
                        <AvatarFallback>
                          {user?.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <Smartphone className="mr-2 h-4 w-4" />
                    <span>My Devices</span>
                  </DropdownMenuItem>
                  {isManager && (
                    <DropdownMenuItem
                      onClick={() => navigate('/device-management')}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Manage Devices</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate('/login')}>Login</Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
