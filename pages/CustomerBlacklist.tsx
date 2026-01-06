import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Search, 
  Plus, 
  AlertTriangle, 
  Users, 
  ChevronRight,
  Phone,
  Calendar,
  User,
  Trash2,
  Edit,
  Ban
} from 'lucide-react';
import { 
  getBlacklistEntries, 
  searchBlacklistByPhone,
  addToBlacklist,
  updateBlacklistEntry,
  removeFromBlacklist,
  deleteBlacklistEntry,
  getCustomerBlacklistStats,
  getProfile
} from '@/db/api';
import type { CustomerBlacklist } from '@/types/types';
import { supabase } from '@/db/supabase';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BlacklistFormData {
  phone_number: string;
  customer_name?: string;
  reason: string;
  date_blacklisted: string;
}

export default function CustomerBlacklistPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [entries, setEntries] = useState<CustomerBlacklist[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<CustomerBlacklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, removed: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'removed'>('active');
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CustomerBlacklist | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<CustomerBlacklist | null>(null);

  const form = useForm<BlacklistFormData>({
    defaultValues: {
      phone_number: '',
      customer_name: '',
      reason: '',
      date_blacklisted: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    loadUser();
    loadData();
    checkAdminStatus();
  }, []);

  const loadUser = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
  };

  useEffect(() => {
    applyFilters();
  }, [entries, searchQuery, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entriesData, statsData] = await Promise.all([
        getBlacklistEntries(),
        getCustomerBlacklistStats()
      ]);
      setEntries(entriesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading blacklist data:', error);
      toast.error('Failed to load blacklist data');
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    if (!user) return;
    try {
      const profile = await getProfile(user.id);
      setIsAdmin(profile?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...entries];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.phone_number?.toLowerCase().includes(query) ||
        e.customer_name?.toLowerCase().includes(query) ||
        e.reason?.toLowerCase().includes(query) ||
        e.reported_by_name?.toLowerCase().includes(query)
      );
    }

    setFilteredEntries(filtered);
  };

  const handleAddNew = () => {
    setEditingEntry(null);
    form.reset({
      phone_number: '',
      customer_name: '',
      reason: '',
      date_blacklisted: new Date().toISOString().split('T')[0],
    });
    setFormOpen(true);
  };

  const handleEdit = (entry: CustomerBlacklist) => {
    setEditingEntry(entry);
    form.reset({
      phone_number: entry.phone_number,
      customer_name: entry.customer_name || '',
      reason: entry.reason,
      date_blacklisted: entry.date_blacklisted,
    });
    setFormOpen(true);
  };

  const handleSubmit = async (data: BlacklistFormData) => {
    if (!user) return;

    try {
      const profile = await getProfile(user.id);
      if (!profile) {
        toast.error('User profile not found');
        return;
      }

      if (editingEntry) {
        await updateBlacklistEntry(editingEntry.id, {
          phone_number: data.phone_number,
          customer_name: data.customer_name || null,
          reason: data.reason,
          date_blacklisted: data.date_blacklisted,
        });
        toast.success('Blacklist entry updated successfully');
      } else {
        const existing = await searchBlacklistByPhone(data.phone_number);
        if (existing) {
          toast.error('This phone number is already blacklisted');
          return;
        }

        await addToBlacklist({
          phone_number: data.phone_number,
          customer_name: data.customer_name,
          reason: data.reason,
          date_blacklisted: data.date_blacklisted,
          reported_by_id: user.id,
          reported_by_name: profile.full_name || 'Unknown',
        });
        toast.success('Customer added to blacklist successfully');
      }

      setFormOpen(false);
      setEditingEntry(null);
      form.reset();
      loadData();
    } catch (error: any) {
      console.error('Error saving blacklist entry:', error);
      toast.error(error.message || 'Failed to save blacklist entry');
    }
  };

  const handleRemove = async (entry: CustomerBlacklist) => {
    try {
      await removeFromBlacklist(entry.id);
      toast.success('Customer removed from blacklist');
      loadData();
    } catch (error) {
      console.error('Error removing from blacklist:', error);
      toast.error('Failed to remove from blacklist');
    }
  };

  const handleDelete = async () => {
    if (!entryToDelete) return;

    try {
      await deleteBlacklistEntry(entryToDelete.id);
      toast.success('Blacklist entry deleted permanently');
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
      loadData();
    } catch (error) {
      console.error('Error deleting blacklist entry:', error);
      toast.error('Failed to delete blacklist entry');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Active</Badge>;
    }
    return <Badge className="bg-muted text-muted-foreground">Removed</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <button onClick={() => navigate('/home')} className="hover:text-foreground transition-colors">
                Home
              </button>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Customer Blacklist</span>
            </nav>
            <h1 className="text-3xl font-bold">Customer Blacklist</h1>
            <p className="text-muted-foreground mt-1">
              Manage blacklisted customer phone numbers
            </p>
          </div>
          <Button onClick={handleAddNew} className="gap-2">
            <Plus className="w-4 h-4" />
            Add to Blacklist
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <Users className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">All blacklist entries</p>
            </CardContent>
          </Card>

          <Card className="border-red-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.active}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently blacklisted</p>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Removed</CardTitle>
              <Ban className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.removed}</div>
              <p className="text-xs text-muted-foreground mt-1">Removed from blacklist</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by phone, name, reason, or reporter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="removed">Removed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {filteredEntries.length} of {entries.length} entries
            </div>
          </CardContent>
        </Card>

        {/* Blacklist Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">
                Loading blacklist entries...
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No blacklist entries found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date Blacklisted</TableHead>
                    <TableHead>Reported By</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {entry.phone_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {entry.customer_name || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={entry.reason}>
                        {entry.reason}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(entry.date_blacklisted), 'dd/MM/yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>{entry.reported_by_name || '-'}</TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {entry.status === 'active' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(entry)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemove(entry)}
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEntryToDelete(entry);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Edit Blacklist Entry' : 'Add to Blacklist'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phone_number"
                rules={{ required: 'Phone number is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="966XXXXXXXXX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter customer name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                rules={{ required: 'Reason is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Blacklisting *</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Explain why this customer is being blacklisted..."
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_blacklisted"
                rules={{ required: 'Date is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Blacklisted *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEntry ? 'Update' : 'Add to Blacklist'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blacklist Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this blacklist entry? This action cannot be undone.
              <br /><br />
              <strong>Phone: {entryToDelete?.phone_number}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
