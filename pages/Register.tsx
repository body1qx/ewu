import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, User, Mail, Lock, Sparkles, Brain, BookOpen, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!fullName.trim()) {
      toast.error('يا شاطر، فيه حقول فاضية! اكتب اسمك الكامل 😅');
      return;
    }
    
    if (!email.trim()) {
      toast.error('الإيميل وين؟ ما تبي تدخل ولا كيف؟ 📧');
      return;
    }
    
    if (password.length < 6) {
      toast.error('كلمة السر ضعيفة! حطّ 6 حروف على الأقل عشان تكون قوية 💪');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('كلمتين السر مو متطابقات! ركّز شوي يا بطل 🔐');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        toast.success('تمام يا بطل! تم التسجيل بنجاح ✅ شيك على إيميلك عشان تفعّل الحساب 📧');
      } else {
        toast.success('تمام يا بطل! تم التسجيل بنجاح ✅ الحين انتظر موافقة الأدمن... ⏳');
      }
      
      // Redirect to pending page
      setTimeout(() => {
        navigate('/pending');
      }, 1500);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'في مشكلة في التسجيل! جرّب مرة ثانية 🤔');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-[#4B1E27] via-[#6A1B2C] to-[#4B1E27]">
      {/* LEFT SIDE - Animated Visual Area */}
      <div className="hidden xl:flex xl:w-1/2 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Floating Circles */}
          <div className="absolute top-20 left-20 w-64 h-64 bg-[#FFB300]/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-32 right-32 w-80 h-80 bg-[#FF7A00]/15 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-[#FFB300]/10 rounded-full blur-2xl animate-pulse-slow" />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#4B1E27]/50 to-[#4B1E27]/80" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 animate-fade-in-up">
          {/* Logo */}
          <div className="mb-8 animate-fade-in">
            <img 
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-7r3p9m8hrh1c/conv-7tw4zia1j9j4/20251129/file-7vfzqkto0t8g.png" 
              alt="Shawarmer Logo" 
              className="h-16 w-auto mb-6"
              onError={(e) => {
                e.currentTarget.src = '/shawarmer-logo.png';
              }}
            />
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight animate-fade-in-up" dir="rtl">
            شاورمر
            <br />
            <span className="gradient-text">مركز خدمة العملاء الشاورمري 🌯</span>
          </h1>
          
          <p className="text-xl text-white/80 mb-12 max-w-lg animate-fade-in-up animation-delay-200" dir="rtl">
            ادخل البوابة الداخلية عشان توصل للأدوات، المعلومات، والمساعد الذكي حقنا 🤖
          </p>

          {/* Feature Icons */}
          <div className="grid grid-cols-2 gap-6 max-w-md animate-fade-in-up animation-delay-400">
            <div className="flex items-center gap-3 text-white/90 group" dir="rtl">
              <div className="w-12 h-12 rounded-xl bg-[#FFB300]/20 flex items-center justify-center group-hover:bg-[#FFB300]/30 transition-all duration-300 group-hover:scale-110">
                <Brain className="w-6 h-6 text-[#FFB300]" />
              </div>
              <span className="font-medium">المساعد الذكي 🧠</span>
            </div>
            
            <div className="flex items-center gap-3 text-white/90 group" dir="rtl">
              <div className="w-12 h-12 rounded-xl bg-[#FFB300]/20 flex items-center justify-center group-hover:bg-[#FFB300]/30 transition-all duration-300 group-hover:scale-110">
                <BookOpen className="w-6 h-6 text-[#FFB300]" />
              </div>
              <span className="font-medium">مخ الشاورمرية 📚</span>
            </div>
            
            <div className="flex items-center gap-3 text-white/90 group" dir="rtl">
              <div className="w-12 h-12 rounded-xl bg-[#FFB300]/20 flex items-center justify-center group-hover:bg-[#FFB300]/30 transition-all duration-300 group-hover:scale-110">
                <Wrench className="w-6 h-6 text-[#FFB300]" />
              </div>
              <span className="font-medium">عدّة الشغل 🛠️</span>
            </div>
            
            <div className="flex items-center gap-3 text-white/90 group" dir="rtl">
              <div className="w-12 h-12 rounded-xl bg-[#FFB300]/20 flex items-center justify-center group-hover:bg-[#FFB300]/30 transition-all duration-300 group-hover:scale-110">
                <Sparkles className="w-6 h-6 text-[#FFB300]" />
              </div>
              <span className="font-medium">شغل ذكي ومرتب ⚡</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8 xl:p-16 relative">
        {/* Mobile Background Elements */}
        <div className="xl:hidden absolute inset-0">
          <div className="absolute top-20 left-10 w-48 h-48 bg-[#FFB300]/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-[#FF7A00]/15 rounded-full blur-3xl animate-float-delayed" />
        </div>

        {/* Form Card */}
        <Card className="w-full max-w-md relative z-10 shadow-2xl border-[#FFB300]/20 backdrop-blur-sm bg-background/95 animate-slide-in-right">
          <CardHeader className="text-center space-y-2 pb-6">
            {/* Mobile Logo */}
            <div className="xl:hidden flex justify-center mb-4">
              <img 
                src="https://miaoda-conversation-file.s3cdn.medo.dev/user-7r3p9m8hrh1c/conv-7tw4zia1j9j4/20251129/file-7vfzqkto0t8g.png" 
                alt="Shawarmer Logo" 
                className="h-16 w-auto"
                onError={(e) => {
                  e.currentTarget.src = '/shawarmer-logo.png';
                }}
              />
            </div>

            <CardTitle className="text-3xl font-bold" dir="rtl">سجّل حسابك يا شاورمري 😎</CardTitle>
            <CardDescription className="text-base" dir="rtl">
              حسابك بيتفعّل بعد ما الأدمن يوافق عليه (ما تستعجل يا بطل 😄)
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium" dir="rtl">
                  اسمك الكامل
                </Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#FFB300] transition-colors" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="مثال: محمد العتيبي"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-11 focus-visible:ring-[#FFB300] focus-visible:border-[#FFB300] transition-all"
                    disabled={loading}
                    required
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium" dir="rtl">
                  الإيميل حقك
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#FFB300] transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="مثال: mohammed@shawarmer.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 focus-visible:ring-[#FFB300] focus-visible:border-[#FFB300] transition-all"
                    disabled={loading}
                    required
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium" dir="rtl">
                  كلمة السر (خلها قوية شوي 🔒)
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#FFB300] transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 focus-visible:ring-[#FFB300] focus-visible:border-[#FFB300] transition-all"
                    disabled={loading}
                    required
                    minLength={6}
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium" dir="rtl">
                  أكّد كلمة السر (عشان ما تنساها 😅)
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[#FFB300] transition-colors" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-11 focus-visible:ring-[#FFB300] focus-visible:border-[#FFB300] transition-all"
                    disabled={loading}
                    required
                    minLength={6}
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#FFB300] hover:bg-[#FFB300]/90 text-[#4B1E27] font-semibold text-base shadow-lg hover:shadow-xl hover:shadow-[#FFB300]/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span dir="rtl">جاري التسجيل... ⏳</span>
                  </>
                ) : (
                  <span dir="rtl">سجّل الحين 🚀</span>
                )}
              </Button>

              {/* Info Text */}
              <div className="pt-2 space-y-3">
                <p className="text-xs text-center text-muted-foreground leading-relaxed" dir="rtl">
                  بعد التسجيل، حسابك بيراجعه الأدمن. بنخبرك لما يتفعّل (خلك صبور يا بطل 🤍)
                </p>
                
                {/* Login Link */}
                <div className="text-center" dir="rtl">
                  <Link 
                    to="/login" 
                    className="text-sm text-[#FFB300] hover:text-[#FFB300]/80 font-medium transition-colors hover:underline"
                  >
                    عندك حساب؟ ادخل من هنا 👈
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
