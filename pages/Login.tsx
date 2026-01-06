import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, BookOpen, Database, GraduationCap, FileText, Sparkles, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CorsErrorHelper } from '@/components/common/CorsErrorHelper';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<Error | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const navigate = useNavigate();

  // Clear any stale auth sessions on mount
  useEffect(() => {
    const clearStaleAuth = async () => {
      try {
        // Clear localStorage items related to old Supabase instances
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-') && !key.includes('scwiswhmlyhzifebjmek')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Sign out any existing session
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Error clearing stale auth:', error);
      }
    };
    
    clearStaleAuth();
  }, []);

  // Mouse tracking for parallax glow effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);

    try {
      // Clear any stale auth data first
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw new Error(error.message || 'Failed to login. Please check your credentials.');
      }

      // Fetch user profile to check status
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('status, role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          throw new Error('Failed to load user profile');
        }

        if (!profile) {
          throw new Error('User profile not found');
        }

        toast.success(t('auth.login.success'));

        // Redirect based on user status - CRITICAL: Check status FIRST
        if (profile.status === 'pending') {
          navigate('/pending', { replace: true });
        } else if (profile.status === 'suspended') {
          navigate('/suspended', { replace: true });
        } else if (profile.status === 'active') {
          // Active users go to appropriate dashboard
          if (profile.role === 'admin') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/home', { replace: true });
          }
        } else {
          // Unknown status - default to pending for safety
          navigate('/pending', { replace: true });
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Login failed:', err);
      setLoginError(err);
      toast.error(err.message || 'Invalid login credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: 'مخ الشاورمرية 🧠',
      description: 'كل الردود الجاهزة والإجراءات... خلك ذكي وما تتعب نفسك 😎'
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: 'قاعدة بيانات المنيو 🌯',
      description: 'كل تفاصيل الوجبات والأسعار والحساسية... عشان لو أحد سألك ما تتلخبط 🤤'
    },
    {
      icon: <GraduationCap className="w-5 h-5" />,
      title: 'مواد التدريب 📖',
      description: 'تدريبات ومواد تعليمية... عشان تصير أسطورة في خدمة العملاء 🏆'
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: 'معالجة الشكاوي 🛠',
      description: 'نماذج احترافية وطرق حل المشاكل... خلنا نحل الموضوع بهدوء 😌'
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: 'المساعد الذكي حقنا 🧠✨',
      description: 'أدوات ذكية تساعدك تكتب ردود محترمة بسرعة... الذكاء الاصطناعي خادمك 🤖'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#2a0015] via-[#4b001f] to-[#2a0015] relative">
      {/* Animated Glow Background - Follows Mouse */}
      <div 
        className="absolute w-[800px] h-[800px] rounded-full blur-3xl opacity-30 transition-all duration-1000 ease-out pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #FFB300 0%, #FF7A00 50%, transparent 70%)',
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl mx-4 xl:mx-8 animate-fade-in">
        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="grid xl:grid-cols-2 gap-0">
            {/* LEFT SIDE - Login Form */}
            <div className="p-8 xl:p-12 flex flex-col justify-center">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <img 
                  src="https://miaoda-conversation-file.s3cdn.medo.dev/user-7r3p9m8hrh1c/conv-7tw4zia1j9j4/20251129/file-7vfzqkto0t8g.png" 
                  alt="Shawarmer Logo" 
                  className="h-20 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/shawarmer-logo.png';
                  }}
                />
              </div>

              {/* Titles */}
              <div className="text-center mb-6">
                <h1 className="text-2xl xl:text-3xl font-bold text-white mb-2" dir="rtl">
                  يا هلا! جاهز تدخل عالم الشاورمرية؟ 🔐🌯
                </h1>
                <p className="text-sm xl:text-base text-white/70 mb-4" dir="rtl">
                  دخّل بياناتك وخلنا نبدأ الشغل... ولا نسيت الباسورد مرة ثانية؟ 😅
                </p>
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFB300]/20 border border-[#FFB300]/30">
                  <span className="text-xs text-[#FFB300] font-medium" dir="rtl">
                    مخصص فقط لموظفي خدمة العملاء ✨
                  </span>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-5 mt-8">
                {/* Employee ID / Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/90 text-sm font-medium" dir="rtl">
                    الإيميل حقك (أو رقم الموظف لو ناسي الإيميل 😉)
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-[#FFB300] transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="youremail@shawarmer.com - لا تخطي يا شاطر ✍"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#FFB300] focus-visible:border-[#FFB300] transition-all"
                      disabled={loading}
                      required
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/90 text-sm font-medium" dir="rtl">
                    الباسورد السري (اللي دايم تنساه 🙈🔑)
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-[#FFB300] transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••• - حط الباسورد وخلها بينك وبين ربك 🤫"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#FFB300] focus-visible:border-[#FFB300] transition-all"
                      disabled={loading}
                      required
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between" dir="rtl">
                  <button
                    type="button"
                    className="text-sm text-[#FFB300] hover:text-[#FFB300]/80 transition-colors"
                  >
                    نسيت الباسورد؟ عادي صار لأحسن منك 😂
                  </button>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="border-white/20 data-[state=checked]:bg-[#FFB300] data-[state=checked]:border-[#FFB300]"
                    />
                    <label
                      htmlFor="remember"
                      className="text-sm text-white/70 cursor-pointer select-none"
                    >
                      خلي السيستم يتذكرني (عشان ما أدخل بياناتي كل مرة 😴)
                    </label>
                  </div>
                </div>

                {/* Sign In Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[#FFB300] hover:bg-[#FFB300]/90 text-[#2a0015] font-semibold text-base shadow-lg hover:shadow-xl hover:shadow-[#FFB300]/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      <span dir="rtl">جاري الدخول... ⏳</span>
                    </>
                  ) : (
                    <span dir="rtl">يلا ندخل! 🚀</span>
                  )}
                </Button>

                {/* CORS Error Helper */}
                {loginError && (
                  <CorsErrorHelper 
                    error={loginError} 
                    onRetry={() => {
                      setLoginError(null);
                      handleLogin(new Event('submit') as unknown as React.FormEvent);
                    }} 
                  />
                )}

                {/* Create Account Link */}
                <div className="text-center pt-4" dir="rtl">
                  <span className="text-sm text-white/60">جديد عندنا؟ توّك موظف؟ </span>
                  <Link 
                    to="/register" 
                    className="text-sm text-[#FFB300] hover:text-[#FFB300]/80 font-medium transition-colors hover:underline"
                  >
                    سجّل حساب جديد من هنا يا بطل 🎉
                  </Link>
                </div>
              </form>
            </div>

            {/* RIGHT SIDE - Platform Access */}
            <div className="bg-white/5 backdrop-blur-sm p-8 xl:p-12 border-l border-white/10 flex flex-col justify-center">
              {/* Header */}
              <div className="mb-8" dir="rtl">
                <h3 className="text-2xl font-bold text-white mb-2">
                  وش بتلقى داخل المنصة؟ 🤔✨
                </h3>
                <p className="text-white/60 text-sm">
                  المنصة هذي بتفتح لك أبواب:
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#FFB300]/30 transition-all duration-300 group"
                    dir="rtl"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#FFB300]/20 flex items-center justify-center text-[#FFB300] group-hover:bg-[#FFB300]/30 transition-colors flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-sm mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-white/60 text-xs leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10" dir="rtl">
                <Shield className="w-5 h-5 text-[#FFB300]" />
                <span className="text-white/80 font-medium text-sm">
                  منصة داخلية آمنة 🔒
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
