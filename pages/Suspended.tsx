import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ban, AlertTriangle, Mail, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Suspended() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  const handleBackToLogin = async () => {
    await signOut();
    // No need to navigate - signOut already redirects to /login
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Better gradient background - warmer tones */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-red-50 to-amber-100 dark:from-orange-950/40 dark:via-red-950/40 dark:to-amber-950/40" />

      {/* Main content card */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Glassmorphism card */}
        <div className="backdrop-blur-xl bg-card/90 border border-border rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-7r3p9m8hrh1c/conv-7tw4zia1j9j4/20251129/file-7vfzqkto0t8g.png" 
              alt="Shawarmer Logo" 
              className="h-24 w-auto object-contain drop-shadow-2xl"
              onError={(e) => {
                e.currentTarget.src = '/shawarmer-logo.png';
              }}
            />
          </div>

          {/* Icon with better colors */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Ban className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Status badge */}
          <div className="flex justify-center mb-6">
            <Badge className="px-6 py-2 text-base font-semibold bg-red-500 text-white hover:bg-red-600 shadow-lg" dir="rtl">
              الحالة: الحساب موقوف 🚫
            </Badge>
          </div>

          {/* Main title */}
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground" dir="rtl">
            حسابك موقوف يا حبيبي 😅
          </h1>

          {/* Subtitle */}
          <p className="text-center text-lg text-muted-foreground mb-8 max-w-xl mx-auto" dir="rtl">
            للأسف، تم إيقاف حسابك ومو قادر تدخل مركز شاورمر للمعرفة حالياً 🔒
          </p>

          {/* Info card - Why suspended */}
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-6 mb-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2" dir="rtl">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              أفا! إيش سويت عشان حسابك يتوقف؟ 🤔
            </h3>
            <ul className="space-y-3 text-foreground/80" dir="rtl">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-600 mt-2 flex-shrink-0" />
                <span>ممكن خالفت سياسات النظام (لا تزعل، بس قوانين) 📋</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-600 mt-2 flex-shrink-0" />
                <span>المشرف حقك اتخذ إجراء إداري (يمكن له سبب) 👨‍💼</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-600 mt-2 flex-shrink-0" />
                <span>لقينا مشكلة أمنية في حسابك (سلامتك أولاً) 🔐</span>
              </li>
            </ul>
          </div>

          {/* Additional info - What to do */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2" dir="rtl">
              <Mail className="w-5 h-5 text-amber-600" />
              طيب، إيش أسوي الحين؟ 🤷‍♂️
            </h3>
            <ul className="space-y-2 text-sm text-foreground/80" dir="rtl">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>تواصل مع المشرف الخاص فيك عشان يتأكد من الموضوع 📞</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>كلم قسم الموارد البشرية أو مديرك المباشر 💼</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>شيك على إيميلك، ممكن وصلك رسالة رسمية 📧</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>لا تستعجل، الأمور تنحل بالتفاهم إن شاء الله 🤝</span>
              </li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleBackToLogin}
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 ml-2" />
              <span dir="rtl">رجوع لصفحة الدخول</span>
            </Button>
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-muted-foreground mt-8" dir="rtl">
            للمساعدة، تواصل مع مسؤول النظام أو مشرفك المباشر 🙏
          </p>
        </div>
      </div>
    </div>
  );
}
