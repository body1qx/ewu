import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile, updateUserEmail, updateUserPassword } from '@/db/api';
import type { Profile } from '@/types/types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditUserDialogProps {
  user: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function EditUserDialog({ user, open, onOpenChange, onSuccess }: EditUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    employee_id: '',
    password: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        employee_id: user.employee_id || '',
        password: '',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Update profile information (name, employee_id)
      await updateProfile(user.id, {
        full_name: formData.full_name,
        employee_id: formData.employee_id,
      });

      // Update email if changed
      if (formData.email !== user.email) {
        await updateUserEmail(user.id, formData.email);
      }

      // Update password if provided
      if (formData.password.trim()) {
        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        await updateUserPassword(user.id, formData.password);
      }

      toast.success('User updated successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating user:', error);
      
      // Check for duplicate employee_id error (PostgreSQL error code 23505)
      if (error?.message?.includes('duplicate key') || error?.message?.includes('profiles_employee_id_key')) {
        toast.error('This employee ID is already assigned to another user');
      } else if (error?.message?.includes('duplicate') && error?.message?.includes('email')) {
        toast.error('This email is already assigned to another user');
      } else {
        toast.error(error?.message || 'Failed to update user');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information. Leave password blank to keep current password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                placeholder="Enter employee ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">New Password (Optional)</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank to keep current password"
              />
              <p className="text-sm text-muted-foreground">
                Minimum 6 characters. Leave blank to keep current password.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
