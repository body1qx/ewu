import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Users, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { getAllProfiles, updateUserSchedulability } from '@/db/api';
import type { Profile } from '@/types/types';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'included' | 'excluded';

export default function ScheduleEligibility() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllProfiles();
      const activeUsers = data.filter(u => u.status === 'active' && u.role !== 'guest');
      setUsers(activeUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSchedulability = async (userId: string, currentValue: boolean) => {
    try {
      setUpdatingUsers(prev => new Set(prev).add(userId));
      
      await updateUserSchedulability(userId, !currentValue);
      
      setUsers(prev =>
        prev.map(u =>
          u.id === userId ? { ...u, is_schedulable: !currentValue } : u
        )
      );
      
      toast.success(
        !currentValue
          ? 'User included in schedules'
          : 'User excluded from schedules',
        {
          description: !currentValue
            ? 'This user can now be assigned to shifts'
            : 'This user will not appear in schedule views',
        }
      );
    } catch (error) {
      console.error('Error updating schedulability:', error);
      toast.error('Failed to update schedule eligibility');
    } finally {
      setUpdatingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.position?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'included' && user.is_schedulable) ||
      (filterType === 'excluded' && !user.is_schedulable);

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: users.length,
    included: users.filter(u => u.is_schedulable).length,
    excluded: users.filter(u => !u.is_schedulable).length,
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Schedule Eligibility</CardTitle>
          <CardDescription>Loading users...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Schedule Eligibility Control
            </CardTitle>
            <CardDescription>
              Manage which users can be assigned to schedules. Only included users will appear in schedule views.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              {stats.included} Included
            </Badge>
            <Badge variant="outline" className="gap-1">
              <XCircle className="w-3 h-3 text-gray-500" />
              {stats.excluded} Excluded
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users ({stats.total})</SelectItem>
              <SelectItem value="included">Included Only ({stats.included})</SelectItem>
              <SelectItem value="excluded">Excluded Only ({stats.excluded})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User List */}
        <div className="space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No users found matching your filters</p>
            </div>
          ) : (
            filteredUsers.map(user => {
              const isUpdating = updatingUsers.has(user.id);
              const isSchedulable = user.is_schedulable;

              return (
                <div
                  key={user.id}
                  className={cn(
                    'flex items-center justify-between p-4 border rounded-lg transition-all',
                    isSchedulable
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-muted/50 border-muted',
                    isUpdating && 'opacity-50 pointer-events-none'
                  )}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{user.full_name || 'Unknown'}</p>
                        {isSchedulable ? (
                          <Badge variant="outline" className="gap-1 text-green-600 border-green-600/30 bg-green-500/10">
                            <CheckCircle2 className="w-3 h-3" />
                            Included
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-muted-foreground">
                            <XCircle className="w-3 h-3" />
                            Excluded
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {user.employee_id && (
                          <span className="font-mono">ID: {user.employee_id}</span>
                        )}
                        {user.position && (
                          <span className="px-2 py-0.5 bg-muted rounded text-xs">
                            {user.position}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      <p className="font-medium">
                        {isSchedulable ? 'Schedulable' : 'Not Schedulable'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isSchedulable ? 'Appears in schedules' : 'Hidden from schedules'}
                      </p>
                    </div>
                    <Switch
                      checked={isSchedulable}
                      onCheckedChange={() => handleToggleSchedulability(user.id, isSchedulable)}
                      disabled={isUpdating}
                      className={cn(
                        'data-[state=checked]:bg-green-600',
                        isSchedulable && 'shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                      )}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Info Footer */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Only users with the toggle enabled will appear in schedule assignment lists and schedule views.
            This helps keep your schedules clean and organized.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
