import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, Mail, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Pending() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  const handleBackToLogin = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary via-secondary to-primary">
      {/* Main content card - static, no animations */}
      <div className="w-full max-w-2xl">
        {/* Card */}
        <div className="bg-card border border-border rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-7r3p9m8hrh1c/conv-7tw4zia1j9j4/20251129/file-7vfzqkto0t8g.png" 
              alt="Shawarmer Logo" 
              className="h-24 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.src = '/shawarmer-logo.png';
              }}
            />
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-accent-orange flex items-center justify-center">
              <Clock className="w-12 h-12 text-primary" strokeWidth={2.5} />
            </div>
          </div>

          {/* Status badge */}
          <div className="flex justify-center mb-6">
            <Badge className="px-6 py-2 text-base font-semibold bg-accent text-primary" dir="rtl">
              الحالة: في انتظار الموافقة ⏳
            </Badge>
          </div>

          {/* Main title */}
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground" dir="rtl">
            حسابك في انتظار الموافقة 🕐
          </h1>

          {/* Subtitle */}
          <p className="text-center text-lg text-muted-foreground mb-8 max-w-xl mx-auto" dir="rtl">
            شكراً لك على التسجيل في منصة شاورمر! حسابك الحين تحت المراجعة من فريق الإدارة (خلك صبور يا بطل 😊)
          </p>

          {/* Info card */}
          <div className="bg-muted border border-border rounded-2xl p-6 mb-8" dir="rtl">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              وش اللي بيصير بعدين؟ 🤔
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                <span>حسابك بيراجعه الأدمن (ما يطول إن شاء الله 🙏)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                <span>بنرسل لك إشعار لما يتفعّل حسابك (شيك على الإيميل 📧)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                <span>بعد الموافقة، بتقدر تدخل على كل مميزات النظام (يلا استعد 🚀)</span>
              </li>
            </ul>
          </div>

          {/* Additional info */}
          <div className="bg-accent/10 border border-accent/20 rounded-2xl p-6 mb-8" dir="rtl">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-accent" />
              وأنت تنتظر... 💭
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>تأكد إن بياناتك صحيحة (لا تكون كاتب إيميل غلط 😅)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>تواصل مع مديرك إذا تحتاج تفعيل سريع (لو الموضوع مستعجل 🏃)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>شيك على إيميلك عشان إشعار الموافقة (لا يضيع في السبام 📬)</span>
              </li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleBackToLogin}
              size="lg"
              className="text-lg px-8 py-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span dir="rtl">ارجع لصفحة الدخول 👈</span>
            </Button>
          </div>

          {/* Footer note */}
          <p className="text-center text-sm text-muted-foreground mt-8" dir="rtl">
            تحتاج مساعدة؟ تواصل مع الأدمن حقك 🤝
          </p>
        </div>
      </div>
    </div>
  );
}
