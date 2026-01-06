import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { createWidget, updateWidget } from '@/db/api';
import type { DashboardWidget } from '@/types/types';
import LeaderboardConfigForm from './LeaderboardConfigForm';

interface WidgetConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widget: DashboardWidget | null;
  widgetType: string | null;
  dashboardId: string;
  onSaved: () => void;
}

export default function WidgetConfigDialog({
  open,
  onOpenChange,
  widget,
  widgetType,
  dashboardId,
  onSaved,
}: WidgetConfigDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<any>({
    defaultValues: {
      title: '',
      config: {},
    },
  });

  useEffect(() => {
    if (widget) {
      form.reset({
        title: widget.title,
        config: widget.config,
      });
    } else {
      form.reset({
        title: '',
        config: getDefaultConfig(widgetType || 'metric'),
      });
    }
  }, [widget, widgetType, form]);

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case 'metric':
        return { value: 0, unit: '', trend: 'neutral', color: '#4B1E27', subtitle: '' };
      case 'progress':
        return { current: 0, target: 100, unit: '', color: '#FFB300', show_percentage: true };
      case 'status':
        return { status: 'normal', label: 'Status', color: '#4B1E27', description: '' };
      case 'counter':
        return { value: 0, label: 'Count', color: '#FFB300', animate: false };
      case 'text_block':
        return { content: '', alignment: 'left', font_size: '1rem', color: '' };
      case 'leaderboard':
        return {
          entries: [],
          period: 'This Month',
          subtitle: 'Top performing employees',
          max_entries: 10,
          score_unit: 'points',
          score_color: '#3b82f6',
          show_stats: true,
        };
      default:
        return {};
    }
  };

  const onSubmit = async (values: any) => {
    try {
      setLoading(true);

      if (widget) {
        await updateWidget(widget.id, {
          title: values.title,
          config: values.config,
        });
        toast.success('تمام! تحدث الويدجت 👍');
      } else {
        await createWidget({
          dashboard_id: dashboardId,
          widget_type: widgetType as any,
          title: values.title,
          config: values.config,
          position_x: 0,
          position_y: 0,
          width: 1,
          height: 1,
          display_order: 0,
        });
        toast.success('تمام! انسوى الويدجت 🎉');
      }

      onSaved();
    } catch (error) {
      console.error('Error saving widget:', error);
      toast.error('ما قدرنا نحفظ الويدجت يا خوي 😔');
    } finally {
      setLoading(false);
    }
  };

  const renderConfigFields = () => {
    if (!widgetType) return null;

    switch (widgetType) {
      case 'metric':
        return (
          <>
            <FormField
              control={form.control}
              name="config.value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., tasks, calls, %" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.trend"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trend</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="up">Up</SelectItem>
                      <SelectItem value="down">Down</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );

      case 'progress':
        return (
          <>
            <FormField
              control={form.control}
              name="config.current"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., tasks, calls" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.show_percentage"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Show Percentage</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        );

      case 'status':
        return (
          <>
            <FormField
              control={form.control}
              name="config.status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );

      case 'counter':
        return (
          <>
            <FormField
              control={form.control}
              name="config.value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.animate"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Animate</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        );

      case 'text_block':
        return (
          <>
            <FormField
              control={form.control}
              name="config.content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.alignment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alignment</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );

      case 'leaderboard':
        return <LeaderboardConfigForm form={form} />;

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{widget ? 'تعديل الويدجت ✏️' : 'إضافة ويدجت ➕'}</DialogTitle>
          <DialogDescription>
            ضبط إعدادات ومظهر الويدجت يا خوي
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان الويدجت</FormLabel>
                  <FormControl>
                    <Input placeholder="مثلاً: مجموع المهام المكتملة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {renderConfigFields()}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'جاري الحفظ...' : widget ? 'تحديث' : 'إنشاء'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
