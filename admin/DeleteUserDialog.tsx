import { useState } from 'react';
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
import { deleteUser } from '@/db/api';
import type { Profile } from '@/types/types';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface DeleteUserDialogProps {
  user: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function DeleteUserDialog({ user, open, onOpenChange, onSuccess }: DeleteUserDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await deleteUser(user.id);
      toast.success('User deleted successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{user?.full_name || 'this user'}</strong>?
            <br />
            <br />
            This action cannot be undone. This will permanently delete the user account and remove all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
