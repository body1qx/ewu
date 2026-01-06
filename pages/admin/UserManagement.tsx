import { useEffect, useState } from 'react';
import { getAllProfiles, updateUserStatus, updateUserRole } from '@/db/api';
import type { Profile } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Shield, User } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getAllProfiles();
      setUsers(data);
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

  const handleRoleChange = async (userId: string, role: 'admin' | 'writer' | 'employee') => {
    try {
      await updateUserRole(userId, role);
      toast.success('تم تحديث دور المستخدم بنجاح');
      loadUsers();
    } catch (error) {
      toast.error('فشل تحديث الدور');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.full_name || 'N/A'}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value as 'admin' | 'writer' | 'employee')}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          مدير
                        </div>
                      </SelectItem>
                      <SelectItem value="writer">
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          كاتب
                        </div>
                      </SelectItem>
                      <SelectItem value="employee">
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          موظف
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
                <TableCell>
                  <div className="flex gap-2">
                    {user.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(user.id, 'active')}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                    )}
                    {user.status === 'active' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusChange(user.id, 'suspended')}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Suspend
                      </Button>
                    )}
                    {user.status === 'suspended' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(user.id, 'active')}
                      >
                        Reactivate
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
