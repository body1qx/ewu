import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Eye, Calendar, Image as ImageIcon } from 'lucide-react';
import { getAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, uploadAnnouncementImage } from '@/db/api';
import { Announcement } from '@/types/types';
import { format } from 'date-fns';

export default function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    content: '',
    priority: 'normal' as 'high' | 'normal' | 'low',
    status: 'published' as 'draft' | 'published',
    scheduled_date: '',
    banner_image_url: ''
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await getAllAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('خطأ في تحميل الإعلانات:', error);
      toast.error('في مشكلة في تحميل الإعلانات! جرّب مرة ثانية 🤔');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('الصورة لازم تكون أصغر من 1 ميجا! خفّف شوي 😅');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let bannerImageUrl = formData.banner_image_url;
      
      if (imageFile) {
        const uploadedUrl = await uploadAnnouncementImage(imageFile);
        if (uploadedUrl) {
          bannerImageUrl = uploadedUrl;
        }
      }

      const announcementData = {
        ...formData,
        banner_image_url: bannerImageUrl,
        scheduled_date: formData.scheduled_date ? new Date(formData.scheduled_date).toISOString() : null
      };

      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, announcementData);
        toast.success('تم تحديث الإعلان بنجاح! 🎉');
      } else {
        await createAnnouncement(announcementData);
        toast.success('تم إنشاء الإعلان بنجاح! 🎊');
      }

      setDialogOpen(false);
      resetForm();
      loadAnnouncements();
    } catch (error) {
      console.error('خطأ في حفظ الإعلان:', error);
      toast.error('في مشكلة في حفظ الإعلان! جرّب مرة ثانية 😬');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message || '',
      content: announcement.content || '',
      priority: announcement.priority as 'high' | 'normal' | 'low',
      status: announcement.status as 'draft' | 'published',
      scheduled_date: announcement.scheduled_date ? format(new Date(announcement.scheduled_date), "yyyy-MM-dd'T'HH:mm") : '',
      banner_image_url: announcement.banner_image_url || ''
    });
    setImagePreview(announcement.banner_image_url || null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('متأكد تبي تحذف هذا الإعلان؟ 🗑️')) return;
    
    try {
      await deleteAnnouncement(id);
      toast.success('تم حذف الإعلان بنجاح! ✅');
      loadAnnouncements();
    } catch (error) {
      console.error('خطأ في حذف الإعلان:', error);
      toast.error('في مشكلة في حذف الإعلان! جرّب مرة ثانية 😬');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      content: '',
      priority: 'normal',
      status: 'published',
      scheduled_date: '',
      banner_image_url: ''
    });
    setEditingAnnouncement(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'published' ? 'default' : 'secondary';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle dir="rtl">إدارة الإعلانات 📢</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button dir="rtl">
              <Plus className="w-4 h-4 ml-2" />
              إنشاء إعلان جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle dir="rtl">
                {editingAnnouncement ? 'تعديل الإعلان ✏️' : 'إنشاء إعلان جديد ➕'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" dir="rtl">العنوان *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="اكتب عنوان الإعلان"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" dir="rtl">الرسالة المختصرة *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  placeholder="رسالة قصيرة للإعلان"
                  rows={2}
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" dir="rtl">المحتوى الكامل</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="المحتوى التفصيلي (اختياري)"
                  rows={4}
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority" dir="rtl">الأولوية</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: 'high' | 'normal' | 'low') => 
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger dir="rtl">
                      <SelectValue placeholder="اختر..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high" dir="rtl">عالية 🔴</SelectItem>
                      <SelectItem value="normal" dir="rtl">عادية 🟡</SelectItem>
                      <SelectItem value="low" dir="rtl">منخفضة 🟢</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" dir="rtl">الحالة</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'draft' | 'published') => 
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger dir="rtl">
                      <SelectValue placeholder="اختر..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft" dir="rtl">مسودة 📝</SelectItem>
                      <SelectItem value="published" dir="rtl">منشور 🚀</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_date" dir="rtl">تاريخ الجدولة (اختياري)</Label>
                <Input
                  id="scheduled_date"
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner_image" dir="rtl">صورة البانر (أقصى حجم 1 ميجا)</Label>
                <Input
                  id="banner_image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img 
                      src={imagePreview} 
                      alt="معاينة" 
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                  dir="rtl"
                >
                  إلغاء
                </Button>
                <Button type="submit" dir="rtl">
                  {editingAnnouncement ? 'تحديث ✏️' : 'إنشاء ➕'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground" dir="rtl">جاري تحميل الإعلانات... ⏳</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" dir="rtl">
            ما فيه إعلانات بعد! أنشئ أول إعلان 🚀
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead dir="rtl">العنوان</TableHead>
                <TableHead dir="rtl">الأولوية</TableHead>
                <TableHead dir="rtl">الحالة</TableHead>
                <TableHead dir="rtl">الجدولة</TableHead>
                <TableHead dir="rtl">تاريخ الإنشاء</TableHead>
                <TableHead className="text-right" dir="rtl">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {announcement.banner_image_url && (
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="font-medium" dir="rtl">{announcement.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(announcement.priority)} dir="rtl">
                      {announcement.priority === 'high' ? 'عالية 🔴' : announcement.priority === 'low' ? 'منخفضة 🟢' : 'عادية 🟡'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(announcement.status)} dir="rtl">
                      {announcement.status === 'published' ? 'منشور 🚀' : 'مسودة 📝'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {announcement.scheduled_date ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(announcement.scheduled_date), 'MMM dd, yyyy HH:mm')}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(announcement.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(announcement)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(announcement.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
