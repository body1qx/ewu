import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Users, Briefcase, Save, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getAllProfiles, updateUserPosition } from '@/db/api';
import type { Profile, EmployeePosition } from '@/types/types';

const EMPLOYEE_POSITIONS: EmployeePosition[] = [
  'CRM Agent',
  'CRM Quality',
  'CRM Team Leader',
  'CRM Supervisor',
  'CRM Manager',
];

const POSITION_COLORS: Record<EmployeePosition, string> = {
  'CRM Agent': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'CRM Quality': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'CRM Team Leader': 'bg-green-500/10 text-green-500 border-green-500/20',
  'CRM Supervisor': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'CRM Manager': 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function EmployeeRoles() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [selectedPositions, setSelectedPositions] = useState<Record<string, EmployeePosition | null>>({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllProfiles();
      const activeUsers = data.filter(u => u.status === 'active');
      setUsers(activeUsers);
      
      const positions: Record<string, EmployeePosition | null> = {};
      activeUsers.forEach(user => {
        positions[user.id] = user.position;
      });
      setSelectedPositions(positions);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handlePositionChange = (userId: string, position: string) => {
    setSelectedPositions(prev => ({
      ...prev,
      [userId]: position === 'none' ? null : position as EmployeePosition,
    }));
  };

  const handleSavePosition = async (userId: string) => {
    try {
      setSavingUserId(userId);
      const position = selectedPositions[userId];
      await updateUserPosition(userId, position);
      
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, position } : u
      ));
      
      toast.success('Position updated successfully');
    } catch (error) {
      console.error('Error updating position:', error);
      toast.error('Failed to update position');
    } finally {
      setSavingUserId(null);
    }
  };

  const hasPositionChanged = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user && user.position !== selectedPositions[userId];
  };

  const getPositionBadge = (position: EmployeePosition | null) => {
    if (!position) {
      return (
        <Badge variant="outline" className="bg-muted text-muted-foreground">
          No Position
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className={POSITION_COLORS[position]}>
        {position}
      </Badge>
    );
  };

  const stats = {
    total: users.length,
    withPosition: users.filter(u => u.position).length,
    withoutPosition: users.filter(u => !u.position).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-primary" />
            Employee Roles & Positions
          </h1>
          <p className="text-muted-foreground mt-2">
            Assign job positions to employees for schedule management
          </p>
        </div>
        <Button onClick={loadUsers} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              With Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{stats.withPosition}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Without Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{stats.withoutPosition}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Manage Employee Positions
          </CardTitle>
          <CardDescription>
            Assign positions to employees. Only employees with positions will appear in schedule management.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Current Position</TableHead>
                  <TableHead>Assign Position</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No active users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>{user.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.employee_id || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        {getPositionBadge(user.position)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={selectedPositions[user.id] || 'none'}
                          onValueChange={(value) => handlePositionChange(user.id, value)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Position</SelectItem>
                            {EMPLOYEE_POSITIONS.map((position) => (
                              <SelectItem key={position} value={position}>
                                {position}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleSavePosition(user.id)}
                          disabled={!hasPositionChanged(user.id) || savingUserId === user.id}
                        >
                          {savingUserId === user.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Position Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Position Color Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {EMPLOYEE_POSITIONS.map((position) => (
              <Badge
                key={position}
                variant="outline"
                className={POSITION_COLORS[position]}
              >
                {position}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
