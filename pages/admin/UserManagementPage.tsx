import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAllProfiles, updateUserStatus, updateUserRole } from '@/db/api';
import type { Profile } from '@/types/types';
import { Search, Shield, User, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import EditUserDialog from '@/components/admin/EditUserDialog';
import DeleteUserDialog from '@/components/admin/DeleteUserDialog';

export default function UserManagementPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
      return;
    }
    loadUsers();
  }, [profile, navigate]);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          u =>
            u.full_name?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query) ||
            u.employee_id?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      const data = await getAllProfiles();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, status: 'active' | 'pending' | 'suspended') => {
    try {
      await updateUserStatus(userId, status);
      toast.success('User status updated');
      loadUsers();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleRoleChange = async (userId: string, role: 'admin' | 'writer' | 'employee' | 'supervisor' | 'quality' | 'team_leader' | 'guest') => {
    try {
      await updateUserRole(userId, role);
      toast.success('User role updated successfully');
      loadUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleEditUser = (user: Profile) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    loadUsers();
  };

  const handleDeleteUser = (user: Profile) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    loadUsers();
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="relative gradient-hero-bg py-12 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-accent-orange/20 rounded-full blur-3xl animate-float-delayed" />
        </div>

        <div className="container relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-bold text-primary-foreground mb-2">User Management</h1>
              <p className="text-xl text-primary-foreground/90">
                Manage team members, roles, and permissions
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/admin')}
              className="bg-card/50 backdrop-blur"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, or employee ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 backdrop-blur"
            />
          </div>
        </div>
      </section>

      <div className="container py-12">
        <Card className="shadow-glow">
          <CardHeader>
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            <CardDescription>View and manage all registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as 'admin' | 'writer' | 'employee' | 'supervisor' | 'quality' | 'team_leader' | 'guest')}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center">
                              <Shield className="mr-2 h-4 w-4" />
                              Admin
                            </div>
                          </SelectItem>
                          <SelectItem value="writer">
                            <div className="flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              Writer
                            </div>
                          </SelectItem>
                          <SelectItem value="employee">
                            <div className="flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              Employee
                            </div>
                          </SelectItem>
                          <SelectItem value="supervisor">
                            <div className="flex items-center">
                              <Shield className="mr-2 h-4 w-4" />
                              Supervisor
                            </div>
                          </SelectItem>
                          <SelectItem value="quality">
                            <div className="flex items-center">
                              <Shield className="mr-2 h-4 w-4" />
                              Quality
                            </div>
                          </SelectItem>
                          <SelectItem value="team_leader">
                            <div className="flex items-center">
                              <Shield className="mr-2 h-4 w-4" />
                              Team Leader
                            </div>
                          </SelectItem>
                          <SelectItem value="guest">
                            <div className="flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              Guest (Read-Only)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === 'active'
                            ? 'default'
                            : user.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.employee_id || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                        <Select
                          value={user.status}
                          onValueChange={(value) =>
                            handleStatusChange(user.id, value as 'active' | 'pending' | 'suspended')
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Activate</SelectItem>
                            <SelectItem value="pending">Set Pending</SelectItem>
                            <SelectItem value="suspended">Suspend</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <EditUserDialog
        user={editingUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleEditSuccess}
      />

      <DeleteUserDialog
        user={deletingUser}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
