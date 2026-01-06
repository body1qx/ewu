import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/db/supabase';
import type { Profile, SystemSettings } from '@/types/types';
import { getProfile, updateLastLogin, getSystemSettings } from '@/db/api';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Create context with a default value to prevent undefined errors
const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

const LOGIN_TIMESTAMP_KEY = 'shawarmer_login_timestamp';

// القيم الافتراضية (سيتم تحميلها من قاعدة البيانات)
const DEFAULT_SESSION_DURATION = 15 * 60 * 60 * 1000; // 15 hours
const DEFAULT_INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const DEFAULT_WARNING_TIME = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileFetched, setProfileFetched] = useState(false);
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  // إعدادات النظام من قاعدة البيانات
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [sessionDuration, setSessionDuration] = useState(DEFAULT_SESSION_DURATION);
  const [inactivityTimeout, setInactivityTimeout] = useState(DEFAULT_INACTIVITY_TIMEOUT);
  const [warningTime, setWarningTime] = useState(DEFAULT_WARNING_TIME);
  const [autoLogoutEnabled, setAutoLogoutEnabled] = useState(true);

  // مؤقتات تسجيل الخروج التلقائي بسبب عدم النشاط
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  // تحميل إعدادات النظام من قاعدة البيانات
  useEffect(() => {
    const loadSystemSettings = async () => {
      try {
        const settings = await getSystemSettings();
        if (settings) {
          setSystemSettings(settings);
          setSessionDuration(settings.session_duration_hours * 60 * 60 * 1000);
          setInactivityTimeout(settings.inactivity_timeout_minutes * 60 * 1000);
          setWarningTime(settings.warning_time_minutes * 60 * 1000);
          setAutoLogoutEnabled(settings.auto_logout_enabled);
        }
      } catch (error) {
        console.error('خطأ في تحميل إعدادات النظام:', error);
        // استخدام القيم الافتراضية في حالة الخطأ
      }
    };

    loadSystemSettings();

    // إعادة تحميل الإعدادات كل 5 دقائق للحصول على أحدث التغييرات
    const intervalId = setInterval(loadSystemSettings, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // التحقق من انتهاء صلاحية الجلسة
  const checkSessionExpiry = async () => {
    const loginTimestamp = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
    
    if (loginTimestamp) {
      const loginTime = parseInt(loginTimestamp, 10);
      const currentTime = Date.now();
      const elapsedTime = currentTime - loginTime;
      
      // إذا مرت المدة المحددة، قم بتسجيل الخروج تلقائياً
      if (elapsedTime >= sessionDuration) {
        toast.error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', {
          duration: 5000,
        });
        await signOut();
        return true; // Session expired
      }
    }
    
    return false; // Session still valid
  };

  const fetchProfile = async (userId: string) => {
    try {
      // التحقق من انتهاء الجلسة قبل جلب البيانات
      const sessionExpired = await checkSessionExpiry();
      if (sessionExpired) {
        return;
      }

      const profileData = await getProfile(userId);
      setProfile(profileData);
      setProfileFetched(true);
      if (profileData) {
        await updateLastLogin(userId);
        
        // حفظ وقت تسجيل الدخول
        if (!localStorage.getItem(LOGIN_TIMESTAMP_KEY)) {
          localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
        }
        
        // Load language preference
        const userLanguage = profileData.language || 'en';
        if (i18n.language !== userLanguage) {
          await i18n.changeLanguage(userLanguage);
          localStorage.setItem('language', userLanguage);
          document.documentElement.dir = userLanguage === 'ar' ? 'rtl' : 'ltr';
          document.documentElement.lang = userLanguage;
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // Handle language for non-logged-in users
  useEffect(() => {
    if (!user) {
      const savedLanguage = localStorage.getItem('language') || 'en';
      if (i18n.language !== savedLanguage) {
        i18n.changeLanguage(savedLanguage);
        document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = savedLanguage;
      }
    }
  }, [user, i18n]);

  // فحص انتهاء الجلسة بشكل دوري (كل دقيقة)
  useEffect(() => {
    if (user) {
      const intervalId = setInterval(() => {
        checkSessionExpiry();
      }, 60000); // فحص كل دقيقة

      return () => clearInterval(intervalId);
    }
  }, [user]);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // التحقق من انتهاء الجلسة عند بدء التطبيق
        const sessionExpired = await checkSessionExpiry();
        if (!sessionExpired) {
          fetchProfile(session.user.id);
        }
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      
      // Only update if user actually changed
      setUser(newUser);
      
      if (newUser) {
        // حفظ وقت تسجيل الدخول عند تسجيل الدخول الجديد
        if (event === 'SIGNED_IN') {
          localStorage.setItem(LOGIN_TIMESTAMP_KEY, Date.now().toString());
        }
        
        // CRITICAL: Only fetch profile if we don't have one yet
        // This prevents unnecessary refetches that cause the page to flicker
        if (!profileFetched) {
          fetchProfile(newUser.id);
        }
      } else {
        // User logged out - clear profile and login timestamp
        setProfile(null);
        setProfileFetched(false);
        setLoading(false);
        localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
      }
    });

    return () => subscription.unsubscribe();
  }, [profileFetched]);

  // دالة إعادة تعيين مؤقت عدم النشاط
  const resetInactivityTimer = useCallback(() => {
    // التحقق من تفعيل تسجيل الخروج التلقائي
    if (!autoLogoutEnabled) {
      return;
    }

    // إلغاء المؤقتات السابقة
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // إعادة تعيين حالة التحذير
    warningShownRef.current = false;

    // حساب وقت التحذير بالدقائق
    const warningMinutes = Math.floor(warningTime / (60 * 1000));

    // تعيين مؤقت التحذير
    warningTimeoutRef.current = setTimeout(() => {
      if (!warningShownRef.current && user) {
        warningShownRef.current = true;
        toast.warning('تحذير: سيتم تسجيل خروجك قريباً', {
          description: `سيتم تسجيل خروجك تلقائياً بعد ${warningMinutes} دقيقة بسبب عدم النشاط`,
          duration: 10000,
        });
      }
    }, inactivityTimeout - warningTime);

    // حساب مدة عدم النشاط بالدقائق
    const inactivityMinutes = Math.floor(inactivityTimeout / (60 * 1000));

    // تعيين مؤقت تسجيل الخروج التلقائي
    inactivityTimeoutRef.current = setTimeout(() => {
      if (user) {
        toast.error('تم تسجيل خروجك تلقائياً', {
          description: `لم يتم اكتشاف أي نشاط لمدة ${inactivityMinutes} دقيقة`,
          duration: 5000,
        });
        signOut();
      }
    }, inactivityTimeout);
  }, [user, autoLogoutEnabled, inactivityTimeout, warningTime]);

  // تتبع نشاط المستخدم
  useEffect(() => {
    // فقط تفعيل المؤقت إذا كان المستخدم مسجل دخول وتسجيل الخروج التلقائي مفعّل
    if (!user || !autoLogoutEnabled) {
      return;
    }

    // الأحداث التي تشير إلى نشاط المستخدم
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // إعادة تعيين المؤقت عند أي نشاط
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // إضافة مستمعي الأحداث
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // بدء المؤقت
    resetInactivityTimer();

    // التنظيف عند إلغاء التثبيت
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [user, autoLogoutEnabled, resetInactivityTimer]);

  const signOut = async () => {
    try {
      // إلغاء مؤقتات عدم النشاط
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error during signOut', e);
    } finally {
      // مسح حالة المصادقة المحلية
      setUser(null);
      setProfile(null);
      setProfileFetched(false);
      setLoading(false);
      
      // حذف وقت تسجيل الدخول
      localStorage.removeItem(LOGIN_TIMESTAMP_KEY);

      // استخدام React Router للانتقال السلس بدون إعادة تحميل الصفحة
      navigate('/login', { replace: true });
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}
