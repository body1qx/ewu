import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ExternalLink,
  Edit,
  Plus,
  Trash2,
  Loader2,
  Grid3x3,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { canWrite } from '@/lib/permissions';
import {
  getAllTools,
  createTool,
  updateTool,
  deleteTool,
  uploadToolLogo,
} from '@/db/api';
import type { Tool } from '@/types/types';
import { useTranslation } from 'react-i18next';

export default function ToolsHub() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    url: '',
    logo_url: '',
    category_id: '',
  });

  // Check if user can edit tools (writer or admin only)
  const canEditTools = profile ? canWrite(profile.role) : false;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const toolsData = await getAllTools();
      setTools(toolsData);
    } catch (error) {
      console.error('Error loading tools:', error);
      toast.error('في مشكلة في تحميل الأدوات! جرّب مرة ثانية 🤔');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTool = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEditTool = (tool: Tool) => {
    setEditingTool(tool);
    setFormData({
      name: tool.name,
      tagline: tool.tagline || '',
      description: tool.description || '',
      url: tool.url,
      logo_url: tool.logo_url || '',
      category_id: tool.category_id || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleAddTool = () => {
    setEditingTool(null);
    setFormData({
      name: '',
      tagline: '',
      description: '',
      url: '',
      logo_url: '',
      category_id: '',
    });
    setIsAddDialogOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1048576) {
      toast.error('الصورة لازم تكون أصغر من 1 ميجا! خفّف شوي 😅');
      return;
    }

    try {
      setUploading(true);
      const logoUrl = await uploadToolLogo(file);
      setFormData(prev => ({ ...prev, logo_url: logoUrl }));
      toast.success('تم رفع الشعار بنجاح! 🎉');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('في مشكلة في رفع الشعار! جرّب مرة ثانية 😬');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveTool = async () => {
    if (!formData.name || !formData.url) {
      toast.error('الاسم والرابط مطلوبين! (لازم تعبّيهم 📝)');
      return;
    }

    try {
      if (editingTool) {
        await updateTool(editingTool.id, formData);
        toast.success('تم تحديث الأداة بنجاح! 🎉');
      } else {
        await createTool(formData);
        toast.success('تم إضافة الأداة بنجاح! 🎊');
      }
      setIsEditDialogOpen(false);
      setIsAddDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving tool:', error);
      toast.error('في مشكلة في حفظ الأداة! جرّب مرة ثانية 😬');
    }
  };

  const handleDeleteTool = async (id: string) => {
    if (!confirm('متأكد تبي تحذف هذي الأداة؟ 🗑️')) return;

    try {
      await deleteTool(id);
      toast.success('تم حذف الأداة بنجاح! ✅');
      loadData();
    } catch (error) {
      console.error('Error deleting tool:', error);
      toast.error('في مشكلة في حذف الأداة! جرّب مرة ثانية 😬');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B0F0F] via-[#6A1B2C] to-[#8B2635]">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Grid3x3 className="h-10 w-10 text-[#F6B600]" />
                <h1 className="text-4xl font-bold text-white" dir="rtl">مركز الأدوات 🛠️</h1>
              </div>
              <p className="text-white/70" dir="rtl">
                كل أدواتك اللي تحتاجها في مكان واحد (عشان ما تضيع وقتك تدور! 😅)
              </p>
            </div>
            {canEditTools && (
              <Button
                onClick={handleAddTool}
                className="bg-[#F6B600] hover:bg-[#F6B600]/90 text-black font-semibold"
                dir="rtl"
              >
                <Plus className="ml-2 h-5 w-5" />
                إضافة أداة جديدة ➕
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map(tool => (
            <Card
              key={tool.id}
              className="group relative bg-white/10 border-white/20 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#F6B600]/20 cursor-pointer"
              onMouseEnter={() => setHoveredTool(tool.id)}
              onMouseLeave={() => setHoveredTool(null)}
              style={{
                transform: hoveredTool === tool.id ? 'translateY(-8px)' : 'translateY(0)',
              }}
            >
              <CardContent className="p-6">
                {/* Logo */}
                <div className="flex items-center justify-center mb-4 h-20">
                  {tool.logo_url ? (
                    <img
                      src={tool.logo_url}
                      alt={tool.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-[#F6B600]/20 flex items-center justify-center">
                      <Grid3x3 className="h-8 w-8 text-[#F6B600]" />
                    </div>
                  )}
                </div>

                {/* Tool Info */}
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-white">{tool.name}</h3>
                  {tool.tagline && (
                    <p className="text-sm text-white/70">{tool.tagline}</p>
                  )}
                </div>

                {/* Hover Panel */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/90 to-black/80 backdrop-blur-md transition-all duration-300 flex flex-col justify-end p-6 ${
                    hoveredTool === tool.id
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-full'
                  }`}
                >
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-bold text-white mb-2" dir="rtl">{tool.name}</h4>
                      <p className="text-sm text-white/80 line-clamp-3" dir="rtl">
                        {tool.description || 'ما فيه وصف متاح (يبيله تحديث! 📝)'}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleOpenTool(tool.url)}
                        className="flex-1 bg-[#F6B600] hover:bg-[#F6B600]/90 text-black font-semibold"
                        dir="rtl"
                      >
                        <ExternalLink className="ml-2 h-4 w-4" />
                        فتح الأداة 🚀
                      </Button>
                      {canEditTools && (
                        <Button
                          onClick={() => handleEditTool(tool)}
                          variant="outline"
                          className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {tools.length === 0 && (
          <div className="text-center py-12">
            <Grid3x3 className="h-16 w-16 text-white/30 mx-auto mb-4" />
            <p className="text-white/50 text-lg" dir="rtl">ما فيه أدوات بعد! (أضف أول أداة 🚀)</p>
          </div>
        )}
      </div>

      {/* Edit/Add Tool Dialog */}
      <Dialog open={isEditDialogOpen || isAddDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        setIsAddDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-[#4B0F0F] to-[#6A1B2C] border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white" dir="rtl">
              {editingTool ? 'تعديل الأداة ✏️' : 'إضافة أداة جديدة ➕'}
            </DialogTitle>
            <DialogDescription className="text-white/70" dir="rtl">
              {editingTool
                ? 'عدّل معلومات الأداة (صلّح اللي تبيه! 🔧)'
                : 'عبّي التفاصيل عشان تضيف أداة جديدة (خلّها واضحة! 📝)'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white" dir="rtl">اسم الأداة *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: Zoho Desk"
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline" className="text-white" dir="rtl">الشعار (اختياري)</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                placeholder="مثال: منصة دعم العملاء"
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white" dir="rtl">الوصف (اختياري)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="اشرح وش هذي الأداة وكيف تساعد الموظفين... (خلّها واضحة! 📝)"
                rows={4}
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50 resize-none"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url" className="text-white" dir="rtl">الرابط *</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo" className="text-white" dir="rtl">الشعار (اختياري)</Label>
              <div className="flex items-center gap-4">
                {formData.logo_url && (
                  <img
                    src={formData.logo_url}
                    alt="Logo preview"
                    className="h-16 w-16 object-contain rounded border border-white/20"
                  />
                )}
                <div className="flex-1">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="bg-white/10 border-white/30 text-white file:bg-[#F6B600] file:text-black file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded file:font-semibold"
                  />
                  <p className="text-xs text-white/50 mt-1" dir="rtl">الحد الأقصى: 1 ميجا (لا تحمّل صورة كبيرة! 📸)</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {editingTool && (
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteTool(editingTool.id);
                  setIsEditDialogOpen(false);
                }}
                className="mr-auto"
                dir="rtl"
              >
                <Trash2 className="ml-2 h-4 w-4" />
                حذف 🗑️
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setIsAddDialogOpen(false);
              }}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              dir="rtl"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveTool}
              disabled={uploading}
              className="bg-[#F6B600] hover:bg-[#F6B600]/90 text-black font-semibold"
              dir="rtl"
            >
              {uploading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الرفع... ⏳
                </>
              ) : (
                <>
                  {editingTool ? 'حفظ التعديلات ✅' : 'إضافة الأداة ➕'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
