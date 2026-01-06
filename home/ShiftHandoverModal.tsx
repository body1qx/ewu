import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { createShiftHandoverNote } from '@/db/api';
import { Clock, AlertCircle, Tag } from 'lucide-react';

interface ShiftHandoverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ShiftHandoverModal({ open, onOpenChange, onSuccess }: ShiftHandoverModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    shift_type: 'general',
    priority: 'normal',
    follow_up_required: false,
    tags: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const noteData = {
        title: formData.title,
        content: formData.content,
        shift_type: formData.shift_type,
        priority: formData.priority,
        follow_up_required: formData.follow_up_required,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };

      await createShiftHandoverNote(noteData);
      toast.success('Shift handover note created successfully');
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        shift_type: 'general',
        priority: 'normal',
        follow_up_required: false,
        tags: ''
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating shift handover note:', error);
      toast.error('Failed to create shift handover note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary-glow flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            Create Shift Handover Note
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief summary of the issue or event"
              className="text-base"
              required
            />
            <p className="text-xs text-muted-foreground">
              Keep it short and descriptive (e.g., "System outage", "Customer complaint")
            </p>
          </div>

          {/* Shift Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shift_type" className="text-base font-semibold">
                Shift <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.shift_type}
                onValueChange={(value) => setFormData({ ...formData, shift_type: value })}
              >
                <SelectTrigger id="shift_type">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-base font-semibold">
                Priority <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-base font-semibold">
              Details <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Describe what happened, the impact, what was done, and what the next shift needs to do..."
              className="min-h-[150px] text-base"
              required
            />
            <p className="text-xs text-muted-foreground">
              Include: What happened? Impact? Actions taken? What's needed next?
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-base font-semibold flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags (Optional)
            </Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., delivery, customer-service, technical"
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Follow-up Required */}
          <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
            <Checkbox
              id="follow_up"
              checked={formData.follow_up_required}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, follow_up_required: checked as boolean })
              }
            />
            <div className="flex-1">
              <Label
                htmlFor="follow_up"
                className="text-base font-semibold cursor-pointer flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-accent" />
                Follow-up Required
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Check this if the next shift needs to take action on this issue
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-accent to-primary-glow hover:opacity-90"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Handover Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
