
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import PageContainer from '@/components/layout/PageContainer';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, User, Shield } from 'lucide-react';

const UserManagement: React.FC = () => {
  const { user, users, isAdmin, updateUserRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  // Redirect if not admin
  React.useEffect(() => {
    if (!isAdmin) {
      toast.error('You do not have permission to access this page');
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);
  
  if (!isAdmin || !user) return null;
  
  const handleRoleChange = (userId: string, newRole: 'user' | 'TPM' | 'Software Engineer') => {
    updateUserRole(userId, newRole);
  };
  
  const getRoleBadgeClass = (role: string) => {
    switch(role) {
      case 'admin':
        return 'bg-primary';
      case 'TPM':
        return 'bg-green-500/20 text-green-700';
      case 'Software Engineer':
        return 'bg-green-500/20 text-green-700';
      default:
        return 'bg-blue-500/20 text-blue-700';
    }
  };
  
  return (
    <PageContainer>
      <div className="flex flex-col space-y-6 pt-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">User Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts and permissions
            </p>
          </div>
          
          <Badge variant="outline" className="px-3 py-1 bg-primary/10">
            <Shield className="h-4 w-4 mr-1" />
            Admin Access
          </Badge>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">User</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userData) => (
                  <TableRow key={userData.id}>
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        {userData.avatarUrl ? (
                          <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                        ) : (
                          <AvatarFallback>
                            {userData.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                      {userData.name}
                      {userData.id === user.id && (
                        <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                      )}
                    </TableCell>
                    <TableCell>{userData.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={userData.role === 'admin' ? 'default' : 'outline'}
                        className={getRoleBadgeClass(userData.role)}
                      >
                        {userData.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {userData.role === 'admin' ? (
                        <Badge variant="default" className="bg-primary">
                          Protected
                        </Badge>
                      ) : (
                        <Select
                          defaultValue="user"
                          value={userData.role}
                          onValueChange={(value) => handleRoleChange(
                            userData.id, 
                            value as 'user' | 'TPM' | 'Software Engineer'
                          )}
                        >
                          <SelectTrigger className="w-[160px] px-3 custom-select-trigger">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent side="bottom" align="center" sideOffset={4} className="min-w-[200px]">
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="TPM">TPM</SelectItem>
                            <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="text-center text-sm text-muted-foreground mt-4">
          <p>
            Total users: {users.length} • 
            Admins: {users.filter(u => u.role === 'admin').length} • 
            TPMs: {users.filter(u => u.role === 'TPM').length} • 
            Engineers: {users.filter(u => u.role === 'Software Engineer').length} • 
            Users: {users.filter(u => u.role === 'user').length}
          </p>
        </div>
      </div>
    </PageContainer>
  );
};

export default UserManagement;
