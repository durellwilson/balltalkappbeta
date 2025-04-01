import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Search, UserCog, UserX, Shield, ArrowUpDown } from 'lucide-react';
import { formatDate } from '@/lib/utils';

// User interface matching the User type from schema.ts
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'fan' | 'athlete' | 'admin';
  bio?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  subscriptionTier: 'bronze' | 'silver' | 'gold' | 'none';
  league?: string;
  team?: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('username');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>('');
  
  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  });
  
  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await apiRequest('POST', `/api/users/${userId}/update-role`, { role });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Role Updated',
        description: 'The user role has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Delete user mutation (mock - would be implemented with a real API)
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      // This would be a real API call in production
      // return apiRequest('DELETE', `/api/users/${userId}`);
      
      // Simulate a successful response
      return new Promise(resolve => setTimeout(() => resolve({}), 1000));
    },
    onSuccess: () => {
      toast({
        title: 'User Deleted',
        description: 'The user has been deleted successfully.',
      });
      // In a real app, invalidate the query to refresh the data
      // queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Handle role update
  const handleRoleUpdate = () => {
    if (!selectedUser || !newRole) return;
    updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole });
  };
  
  // Handle user deletion
  const handleDeleteUser = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate(selectedUser.id);
  };
  
  // Open edit dialog
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsEditDialogOpen(true);
  };
  
  // Open delete dialog
  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle sort toggle
  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };
  
  // Filter and sort users
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users
      .filter(user => {
        // Filter by role
        if (roleFilter !== 'all' && user.role !== roleFilter) {
          return false;
        }
        
        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            user.username.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.fullName.toLowerCase().includes(query)
          );
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort users
        let comparison = 0;
        
        switch (sortBy) {
          case 'username':
            comparison = a.username.localeCompare(b.username);
            break;
          case 'fullName':
            comparison = a.fullName.localeCompare(b.fullName);
            break;
          case 'role':
            comparison = a.role.localeCompare(b.role);
            break;
          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          default:
            comparison = 0;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [users, roleFilter, searchQuery, sortBy, sortOrder]);
  
  // Get role badge class
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'athlete':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'fan':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  return (
    <MainLayout 
      title="User Management" 
      description="Manage users, roles, and permissions"
    >
      <div className="mb-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search users by name, email, or username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="athlete">Athlete</SelectItem>
              <SelectItem value="fan">Fan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" disabled>
          <UserCog className="h-4 w-4 mr-2" />
          Add New User
        </Button>
      </div>
      
      {/* Users Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredUsers.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      <button 
                        className="flex items-center font-medium text-gray-500 dark:text-gray-400"
                        onClick={() => toggleSort('username')}
                      >
                        Username
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3">
                      <button 
                        className="flex items-center font-medium text-gray-500 dark:text-gray-400"
                        onClick={() => toggleSort('fullName')}
                      >
                        Name
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3">Email</th>
                    <th scope="col" className="px-6 py-3">
                      <button 
                        className="flex items-center font-medium text-gray-500 dark:text-gray-400"
                        onClick={() => toggleSort('role')}
                      >
                        Role
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3">
                      <button 
                        className="flex items-center font-medium text-gray-500 dark:text-gray-400"
                        onClick={() => toggleSort('createdAt')}
                      >
                        Joined
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </button>
                    </th>
                    <th scope="col" className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            {user.profileImage ? (
                              <img className="h-10 w-10 rounded-full object-cover" src={user.profileImage} alt={user.username} />
                            ) : (
                              <div className="h-10 w-10 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                {user.fullName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500" onClick={() => openDeleteDialog(user)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-10 flex flex-col items-center justify-center">
            <UserCog className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-center">No Users Found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center mt-2">
              No users matching your filters were found.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Edit User Dialog */}
      {selectedUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user role and permissions.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="user-name">User</Label>
                <div id="user-name" className="flex items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mr-2">
                    {selectedUser.profileImage ? (
                      <img className="h-8 w-8 rounded-full object-cover" src={selectedUser.profileImage} alt={selectedUser.username} />
                    ) : (
                      <div className="h-8 w-8 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        {selectedUser.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">@{selectedUser.username}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{selectedUser.email}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="athlete">Athlete</SelectItem>
                    <SelectItem value="fan">Fan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <Shield className="h-4 w-4 inline-block mr-1" />
                  <strong>Note:</strong> Changing a user's role will modify their permissions and access to platform features.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRoleUpdate}
                disabled={updateRoleMutation.isPending || newRole === selectedUser.role}
              >
                {updateRoleMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete User Dialog */}
      {selectedUser && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-500">Delete User</DialogTitle>
              <DialogDescription>
                This action cannot be undone. Are you sure you want to permanently delete this user?
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md flex items-start">
              <UserX className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-800 dark:text-red-300 font-medium">Warning:</p>
                <p className="text-sm text-red-800 dark:text-red-300">
                  Deleting user <strong>@{selectedUser.username}</strong> will permanently remove their account, 
                  content, and all associated data from the platform.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  );
}
