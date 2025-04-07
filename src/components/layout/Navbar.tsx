import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle } from '../ui/ModeToggle';
import { useToast } from '../ui/use-toast';
import { toast } from 'sonner';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast()
  
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <NavLink to="/dashboard" className="mr-4 font-bold text-xl">
            Tecace Device Management
          </NavLink>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  {user.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name} 
                      className="h-10 w-10 rounded-full object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                      }}
                    />
                  ) : (
                    <Avatar>
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="absolute right-0 mt-2 w-48">
                <DropdownMenuItem>
                  <NavLink to="/profile" className="w-full block">
                    Profile
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  logout();
                  toast({
                    title: "Logged out",
                    description: "You have been successfully logged out.",
                  })
                }}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <NavLink to="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </NavLink>
          )}
        <ModeToggle />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
