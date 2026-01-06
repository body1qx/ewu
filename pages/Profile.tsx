import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/components/theme-provider';
import { supabase } from '@/db/supabase';
import { User, Mail, Briefcase, Users, Calendar, Clock, Camera, Edit2, Save, X, Bell, Globe, Palette, MapPin, Phone } from 'lucide-react';
import type { Profile as ProfileType } from '@/types/types';
import AvatarUploadDialog from '@/components/profile/AvatarUploadDialog';
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingInfo, setEditingInfo] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [fullName, setFullName] = useState('');
  const [team, setTeam] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setTeam(data.team || '');
        setLanguage(data.language || 'en');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: t('common.error'),
        description: t('profile.messages.update_error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      toast({
        title: 'خطأ في البيانات 🚫',
        description: 'لازم تكتب اسمك الكامل يا خوي!',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUpdating(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          team: team.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: 'تمام! 🎉',
        description: 'تحدثت معلوماتك بنجاح يا بطل!',
      });
      
      setEditingInfo(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'خطأ 😔',
        description: 'ما قدرنا نحدث معلوماتك، حاول مرة ثانية!',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarUploadSuccess = (url: string, position: { x: number; y: number; zoom: number }) => {
    if (profile) {
      setProfile({ ...profile, profile_image_url: url, avatar_position: position });
    }
  };

  const handleLanguageChange = async (newLanguage: string) => {
    setLanguage(newLanguage);
    
    try {
      // Update language in database
      const { error } = await supabase
        .from('profiles')
        .update({ 
          language: newLanguage,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Change i18n language
      await i18n.changeLanguage(newLanguage);
      
      // Update localStorage
      localStorage.setItem('language', newLanguage);
      
      // Update document direction and lang
      document.documentElement.dir = newLanguage === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = newLanguage;

      toast({
        title: t('common.success'),
        description: t('profile.messages.update_success'),
      });
    } catch (error) {
      console.error('Error updating language:', error);
      toast({
        title: t('common.error'),
        description: t('profile.messages.update_error'),
        variant: 'destructive',
      });
      // Revert on error
      setLanguage(profile?.language || 'en');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'admin' ? 'default' : 'secondary';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPositionLabel = (position: string | null) => {
    if (!position) return 'ما فيه 🤷';
    return position;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent-orange">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent mx-auto mb-4"></div>
          <p className="text-accent text-lg font-medium">جاري التحميل... ⏳</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent-orange">
        <Card className="max-w-md">
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">ما لقينا البروفايل 😕</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const parallaxX = (mousePosition.x - window.innerWidth / 2) / 50;
  const parallaxY = (mousePosition.y - window.innerHeight / 2) / 50;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-accent-orange">
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, hsl(var(--accent-orange) / 0.3) 0%, transparent 50%)`,
        }}
      />

      <div className="absolute top-20 left-20 w-96 h-96 bg-accent-orange/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-accent mb-2 drop-shadow-lg">بروفايلي 👤</h1>
          <p className="text-accent/90 text-lg">تحكم في حسابك وإعداداتك يا خوي 🎯</p>
        </div>

        <Card 
          ref={cardRef}
          className="backdrop-blur-xl bg-background/80 border-accent/20 shadow-elegant overflow-hidden transition-all duration-300"
          style={{
            transform: `perspective(1000px) rotateX(${parallaxY * 0.5}deg) rotateY(${parallaxX * 0.5}deg)`,
          }}
        >
          <CardContent className="p-0">
            <div className="grid xl:grid-cols-3 gap-0">
              <div className="xl:col-span-1 bg-gradient-to-br from-primary/50 to-secondary/50 p-8 flex flex-col items-center text-center border-r border-accent/10">
                <div className="relative group mb-6">
                  <Avatar className="h-40 w-40 border-4 border-accent shadow-glow transition-all duration-300 group-hover:scale-105 overflow-hidden">
                    {profile.profile_image_url ? (
                      <div className="w-full h-full relative">
                        <img
                          src={profile.profile_image_url}
                          alt={profile.full_name || 'User'}
                          className="absolute inset-0 w-full h-full object-cover"
                          style={
                            profile.avatar_position
                              ? {
                                  transform: `translate(${(profile.avatar_position.x - 0.5) * 100}%, ${(profile.avatar_position.y - 0.5) * 100}%) scale(${profile.avatar_position.zoom})`,
                                  transformOrigin: 'center',
                                }
                              : undefined
                          }
                        />
                      </div>
                    ) : (
                      <AvatarFallback className="text-4xl bg-primary text-accent font-bold">
                        {getInitials(profile.full_name || 'User')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => setAvatarDialogOpen(true)}
                    className="absolute bottom-2 right-2 p-3 bg-accent text-primary rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                </div>

                <h2 className="text-3xl font-bold text-accent mb-2">{profile.full_name}</h2>
                <p className="text-accent/80 mb-4">{profile.email}</p>

                <div className="flex gap-2 mb-6">
                  <Badge variant={getRoleBadgeVariant(profile.role)} className="text-sm px-3 py-1">
                    {profile.role.toUpperCase()}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(profile.status)} className="text-sm px-3 py-1">
                    {profile.status.toUpperCase()}
                  </Badge>
                </div>

                <Separator className="my-6 bg-accent/20" />

                <div className="w-full space-y-4 text-left">
                  <div className="flex items-start gap-3 text-accent/90">
                    <Briefcase className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-accent/60 uppercase tracking-wide">المنصب 💼</p>
                      <p className="font-medium">{getPositionLabel(profile.position)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-accent/90">
                    <Users className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-accent/60 uppercase tracking-wide">رقم الموظف 🔢</p>
                      <p className="font-medium">{profile.employee_id || 'ما فيه'}</p>
                    </div>
                  </div>

                  {profile.team && (
                    <div className="flex items-start gap-3 text-accent/90">
                      <Users className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-accent/60 uppercase tracking-wide">الفريق 👥</p>
                        <p className="font-medium">{profile.team}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 text-accent/90">
                    <Calendar className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-accent/60 uppercase tracking-wide">تاريخ الانضمام 📅</p>
                      <p className="font-medium">{formatDate(profile.join_date)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-accent/90">
                    <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-accent/60 uppercase tracking-wide">آخر دخول ⏰</p>
                      <p className="font-medium text-sm">{formatDateTime(profile.last_login)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="xl:col-span-2 p-8 space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
                      <User className="h-6 w-6 text-primary" />
                      المعلومات الشخصية 📝
                    </h3>
                    {!editingInfo ? (
                      <Button
                        onClick={() => setEditingInfo(true)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        تعديل المعلومات ✏️
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setEditingInfo(false);
                            setFullName(profile.full_name || '');
                            setTeam(profile.team || '');
                          }}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          إلغاء ❌
                        </Button>
                        <Button
                          onClick={handleUpdateProfile}
                          size="sm"
                          className="gap-2"
                          disabled={updating}
                        >
                          <Save className="h-4 w-4" />
                          {updating ? 'جاري الحفظ... ⏳' : 'حفظ 💾'}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        الاسم الكامل *
                      </Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="اكتب اسمك الكامل يا خوي"
                        disabled={!editingInfo}
                        className={!editingInfo ? 'bg-muted' : ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        البريد الإلكتروني 📧
                      </Label>
                      <Input
                        id="email"
                        value={profile.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        ما تقدر تغير الإيميل، كلم الإدارة إذا تبي تغيره 🔒
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="employeeId" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        رقم الموظف 🔢
                      </Label>
                      <Input
                        id="employeeId"
                        value={profile.employee_id || 'ما فيه'}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="team" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        الفريق 👥
                      </Label>
                      <Input
                        id="team"
                        value={team}
                        onChange={(e) => setTeam(e.target.value)}
                        placeholder="اكتب اسم فريقك (اختياري)"
                        disabled={!editingInfo}
                        className={!editingInfo ? 'bg-muted' : ''}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Briefcase className="h-6 w-6 text-primary" />
                    معلومات الشغل 💼
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        المنصب
                      </Label>
                      <Input
                        value={getPositionLabel(profile.position)}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        المنصب يتحكم فيه الإدارة 🔒
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        الدور
                      </Label>
                      <Input
                        value={profile.role.toUpperCase()}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        الدور يتحكم فيه الإدارة 🔒
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        تاريخ التوظيف 📅
                      </Label>
                      <Input
                        value={formatDate(profile.join_date)}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        آخر دخول ⏰
                      </Label>
                      <Input
                        value={formatDateTime(profile.last_login)}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Palette className="h-6 w-6 text-primary" />
                    الحساب والإعدادات ⚙️
                  </h3>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <Palette className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">الثيم المفضل 🎨</p>
                          <p className="text-sm text-muted-foreground">اختر الثيم اللي يريحك</p>
                        </div>
                      </div>
                      <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="اختر..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">فاتح ☀️</SelectItem>
                          <SelectItem value="dark">غامق 🌙</SelectItem>
                          <SelectItem value="system">تلقائي 💻</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">إشعارات الإيميل 📧</p>
                          <p className="text-sm text-muted-foreground">استقبل الإشعارات على الإيميل</p>
                        </div>
                      </div>
                      <Switch
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">إشعارات التطبيق 🔔</p>
                          <p className="text-sm text-muted-foreground">استقبل الإشعارات في التطبيق</p>
                        </div>
                      </div>
                      <Switch
                        checked={inAppNotifications}
                        onCheckedChange={setInAppNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">اللغة المفضلة 🌍</p>
                          <p className="text-sm text-muted-foreground">اختر لغتك المفضلة</p>
                        </div>
                      </div>
                      <Select value={language} onValueChange={handleLanguageChange}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="اختر..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar">العربية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AvatarUploadDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        userId={user?.id || ''}
        currentAvatarUrl={profile.profile_image_url}
        onUploadSuccess={handleAvatarUploadSuccess}
      />
    </div>
  );
}
