import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { createShiftHandoverNote, uploadShiftHandoverImage, deleteShiftHandoverImage } from '@/db/api';
import { Sun, Moon, CloudMoon, Users, Calendar, Clock, FileText, Image as ImageIcon, Link as LinkIcon, AlertCircle, Loader2, X, ZoomIn, Save, Send } from 'lucide-react';
import ImageUploadZone from './ImageUploadZone';
import ImageLightbox from './ImageLightbox';

interface ShiftHandoverCreationPanelProps {
  onNoteCreated: () => void;
}

export default function ShiftHandoverCreationPanel({ onNoteCreated }: ShiftHandoverCreationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  const [formData, setFormData] = useState({
    shift_type: 'morning',
    team: '',
    time_range_start: '',
    time_range_end: '',
    title: '',
    content: '',
    images: [] as string[],
    related_ticket_link: '',
    priority: 'normal',
    follow_up_required: false,
    tags: ''
  });

  const handleImageUpload = async (files: File[]) => {
    setUploadingImage(true);
    try {
      const uploadPromises = files.map(file => uploadShiftHandoverImage(file));
      const urls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...urls]
      }));
      
      toast.success(`تم رفع ${files.length} صورة بنجاح! 📸`);
    } catch (error: any) {
      console.error('خطأ في رفع الصور:', error);
      toast.error(error.message || 'في مشكلة في رفع الصور! جرّب مرة ثانية 🤔');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = async (imageUrl: string) => {
    try {
      await deleteShiftHandoverImage(imageUrl);
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(url => url !== imageUrl)
      }));
      toast.success('تم حذف الصورة ✅');
    } catch (error) {
      console.error('خطأ في حذف الصورة:', error);
      toast.error('في مشكلة في حذف الصورة! 🤔');
    }
  };

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!formData.title || !formData.content) {
      toast.error('يا شاطر، فيه حقول فاضية! اكتب العنوان والمحتوى 😅');
      return;
    }

    try {
      setLoading(true);
      
      // Convert time strings (HH:mm) to full timestamps (ISO format)
      const today = new Date().toISOString().split('T')[0];
      const timeRangeStart = formData.time_range_start 
        ? `${today}T${formData.time_range_start}:00` 
        : null;
      const timeRangeEnd = formData.time_range_end 
        ? `${today}T${formData.time_range_end}:00` 
        : null;
      
      const noteData = {
        title: formData.title,
        content: formData.content,
        shift_type: formData.shift_type,
        priority: formData.priority,
        follow_up_required: formData.follow_up_required,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        images: formData.images,
        team: formData.team || null,
        time_range_start: timeRangeStart,
        time_range_end: timeRangeEnd,
        related_ticket_link: formData.related_ticket_link || null,
        is_draft: isDraft
      };

      await createShiftHandoverNote(noteData);
      
      toast.success(isDraft ? 'تم حفظ المسودة بنجاح! 💾' : 'تم نشر ملاحظة التسليم بنجاح! 🚀');
      
      // Reset form
      setFormData({
        shift_type: 'morning',
        team: '',
        time_range_start: '',
        time_range_end: '',
        title: '',
        content: '',
        images: [],
        related_ticket_link: '',
        priority: 'normal',
        follow_up_required: false,
        tags: ''
      });
      
      onNoteCreated();
    } catch (error) {
      console.error('خطأ في إنشاء ملاحظة التسليم:', error);
      toast.error('في مشكلة في إنشاء ملاحظة التسليم! جرّب مرة ثانية 🤔');
    } finally {
      setLoading(false);
    }
  };

  const shiftIcons = {
    morning: Sun,
    afternoon: Sun,
    night: Moon,
    general: CloudMoon
  };

  return (
    <>
      <Card className="glassmorphic border-accent/20 shadow-2xl sticky top-24">
        <CardHeader className="border-b border-accent/20 bg-gradient-to-r from-accent/10 to-primary-glow/10">
          <CardTitle className="text-2xl text-white flex items-center gap-3" dir="rtl">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            إنشاء ملاحظة تسليم شفت 📝
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin">
          {/* Step 1: Shift Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-accent font-semibold" dir="rtl">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm">1</div>
              <span>تفاصيل الشفت</span>
            </div>

            {/* Shift Type Selector with Icons */}
            <div className="space-y-2">
              <Label className="text-white" dir="rtl">نوع الشفت</Label>
              <div className="grid grid-cols-4 gap-2">
                {(['morning', 'afternoon', 'night', 'general'] as const).map((shift) => {
                  const Icon = shiftIcons[shift];
                  const shiftLabels = {
                    morning: 'صباحي ☀️',
                    afternoon: 'ظهري 🌤️',
                    night: 'ليلي 🌙',
                    general: 'عام 🔄'
                  };
                  return (
                    <button
                      key={shift}
                      type="button"
                      onClick={() => setFormData({ ...formData, shift_type: shift })}
                      className={`
                        p-3 rounded-xl border-2 transition-all duration-300
                        flex flex-col items-center gap-2
                        ${formData.shift_type === shift
                          ? 'border-accent bg-accent/20 text-accent shadow-glow'
                          : 'border-white/20 bg-white/5 text-white/60 hover:border-accent/50 hover:bg-accent/10'
                        }
                      `}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-medium" dir="rtl">{shiftLabels[shift]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team Selector */}
            <div className="space-y-2">
              <Label htmlFor="team" className="text-white flex items-center gap-2" dir="rtl">
                <Users className="w-4 h-4" />
                الفريق / القسم
              </Label>
              <Select value={formData.team} onValueChange={(value) => setFormData({ ...formData, team: value })}>
                <SelectTrigger id="team" className="bg-white/10 border-white/20 text-white" dir="rtl">
                  <SelectValue placeholder="اختر الفريق" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crm">CRM</SelectItem>
                  <SelectItem value="delivery">التوصيل 🚗</SelectItem>
                  <SelectItem value="support">الدعم الفني 🛠️</SelectItem>
                  <SelectItem value="kitchen">المطبخ 👨‍🍳</SelectItem>
                  <SelectItem value="operations">العمليات 📊</SelectItem>
                  <SelectItem value="general">عام 🔄</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="time_start" className="text-white text-xs flex items-center gap-1" dir="rtl">
                  <Clock className="w-3 h-3" />
                  من
                </Label>
                <Input
                  id="time_start"
                  type="time"
                  value={formData.time_range_start}
                  onChange={(e) => setFormData({ ...formData, time_range_start: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time_end" className="text-white text-xs flex items-center gap-1" dir="rtl">
                  <Clock className="w-3 h-3" />
                  إلى
                </Label>
                <Input
                  id="time_end"
                  type="time"
                  value={formData.time_range_end}
                  onChange={(e) => setFormData({ ...formData, time_range_end: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Note Content */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-accent font-semibold" dir="rtl">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm">2</div>
              <span>محتوى الملاحظة</span>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white font-semibold" dir="rtl">
                العنوان <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="ملخص سريع عن الموضوع أو الحدث"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-lg font-medium"
                required
                dir="rtl"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-white font-semibold" dir="rtl">
                الوصف <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="اكتب وش صار، ليه مهم، ووش لازم الشفت الجاي يسويه..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[150px]"
                required
                dir="rtl"
              />
            </div>
          </div>

          {/* Step 3: Image Upload */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-accent font-semibold" dir="rtl">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm">3</div>
              <span>الصور (اختياري) 📸</span>
            </div>

            <ImageUploadZone
              onUpload={handleImageUpload}
              uploading={uploadingImage}
            />

            {/* Image Previews */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {formData.images.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative group aspect-square rounded-lg overflow-hidden border-2 border-white/20 hover:border-accent transition-all duration-300"
                  >
                    <img
                      src={imageUrl}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    
                    {/* Glass overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Action buttons */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        type="button"
                        onClick={() => handleImageClick(index)}
                        className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                      >
                        <ZoomIn className="w-4 h-4 text-white" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleImageRemove(imageUrl)}
                        className="w-8 h-8 rounded-full bg-destructive/80 backdrop-blur-sm flex items-center justify-center hover:bg-destructive transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optional Fields */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            {/* Related Ticket Link */}
            <div className="space-y-2">
              <Label htmlFor="ticket_link" className="text-white flex items-center gap-2" dir="rtl">
                <LinkIcon className="w-4 h-4" />
                رابط التذكرة (اختياري) 🔗
              </Label>
              <Input
                id="ticket_link"
                type="url"
                value={formData.related_ticket_link}
                onChange={(e) => setFormData({ ...formData, related_ticket_link: e.target.value })}
                placeholder="https://zoho.com/ticket/12345"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                dir="ltr"
              />
            </div>

            {/* Priority Level */}
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-white flex items-center gap-2" dir="rtl">
                <AlertCircle className="w-4 h-4" />
                مستوى الأهمية
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(['normal', 'high', 'urgent'] as const).map((priority) => {
                  const priorityLabels = {
                    normal: 'عادي ✅',
                    high: 'مهم ⚠️',
                    urgent: 'عاجل 🚨'
                  };
                  return (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority })}
                      className={`
                        p-3 rounded-lg border-2 transition-all duration-300 text-sm font-medium
                        ${formData.priority === priority
                          ? priority === 'urgent'
                            ? 'border-red-500 bg-red-500/20 text-red-300'
                            : priority === 'high'
                            ? 'border-accent-orange bg-accent-orange/20 text-accent-orange'
                            : 'border-accent bg-accent/20 text-accent'
                          : 'border-white/20 bg-white/5 text-white/60 hover:border-white/40'
                        }
                      `}
                    >
                      <span dir="rtl">{priorityLabels[priority]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-white" dir="rtl">الوسوم (افصلها بفاصلة) 🏷️</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="مثال: توصيل، شكوى، عميل مهم"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                dir="rtl"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              <span dir="rtl">حفظ كمسودة 💾</span>
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-accent to-primary-glow hover:opacity-90 text-primary shadow-glow"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              <span dir="rtl">نشر التسليم 🚀</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Image Lightbox */}
      <ImageLightbox
        images={formData.images}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
