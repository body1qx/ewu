import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { createDashboard, updateDashboard } from '@/db/api';
import type { Dashboard, DashboardLayoutType } from '@/types/types';

const formSchema = z.object({
  name: z.string().min(1, 'لازم تكتب اسم اللوحة يا خوي'),
  description: z.string().optional(),
  layout_type: z.enum(['grid', 'masonry', 'free']),
  is_active: z.boolean(),
  display_order: z.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

interface DashboardFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboard: Dashboard | null;
  onSaved: () => void;
  userId: string;
}

export default function DashboardFormDialog({
  open,
  onOpenChange,
  dashboard,
  onSaved,
  userId,
}: DashboardFormDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      layout_type: 'grid',
      is_active: true,
      display_order: 0,
    },
  });

  useEffect(() => {
    if (dashboard) {
      form.reset({
        name: dashboard.name,
        description: dashboard.description || '',
        layout_type: dashboard.layout_type,
        is_active: dashboard.is_active,
        display_order: dashboard.display_order,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        layout_type: 'grid',
        is_active: true,
        display_order: 0,
      });
    }
  }, [dashboard, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      if (dashboard) {
        await updateDashboard(dashboard.id, values);
        toast.success('تمام! تحدثت اللوحة 👍');
      } else {
        await createDashboard({
          ...values,
          created_by: userId,
        });
        toast.success('تمام! انسوت اللوحة 🎉');
      }

      onSaved();
    } catch (error) {
      console.error('Error saving dashboard:', error);
      toast.error('ما قدرنا نحفظ اللوحة يا خوي 😔');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dashboard ? 'تعديل اللوحة ✏️' : 'سوي لوحة جديدة ➕'}</DialogTitle>
          <DialogDescription>
            {dashboard
              ? 'حدث إعدادات اللوحة يا خوي'
              : 'سوي لوحة جديدة بويدجتس مخصصة'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم اللوحة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثلاً: لوحة أداء الفريق" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="وصف مختصر للوحة..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>وصف اختياري للوحة</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="layout_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع التخطيط</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع التخطيط" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="grid">تخطيط شبكي 📐</SelectItem>
                      <SelectItem value="masonry">تخطيط بنترست 🧱</SelectItem>
                      <SelectItem value="free">تخطيط حر 🎨</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    شبكي: تخطيط منظم | بنترست: على طريقة بنترست | حر: مواضع مخصصة
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="display_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ترتيب العرض</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    الأرقام الأقل تظهر أول (0 = أعلى أولوية)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">حالة التفعيل</FormLabel>
                    <FormDescription>
                      اللوحات النشطة بس اللي تظهر للمستخدمين
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

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
                {loading ? 'جاري الحفظ...' : dashboard ? 'تحديث' : 'إنشاء'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
