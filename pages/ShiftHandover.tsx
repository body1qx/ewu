import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Sparkles } from 'lucide-react';
import { getShiftHandoverNotes } from '@/db/api';
import type { ShiftHandoverNote } from '@/types/types';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import ShiftHandoverCreationPanel from '@/components/shift-handover/ShiftHandoverCreationPanel';
import ShiftHandoverTimeline from '@/components/shift-handover/ShiftHandoverTimeline';
import { useMousePosition } from '@/components/home/MouseTracker';
import { canWrite } from '@/lib/permissions';

export default function ShiftHandover() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [notes, setNotes] = useState<ShiftHandoverNote[]>([]);
  const [loading, setLoading] = useState(true);
  const mousePosition = useMousePosition();

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await getShiftHandoverNotes();
      setNotes(data);
    } catch (error) {
      console.error('خطأ في تحميل ملاحظات تسليم الشفت:', error);
      toast.error('في مشكلة في تحميل ملاحظات التسليم! جرّب مرة ثانية 🤔');
    } finally {
      setLoading(false);
    }
  };

  const handleNoteCreated = () => {
    loadNotes();
  };

  const handleNoteUpdated = () => {
    loadNotes();
  };

  const handleNoteDeleted = () => {
    loadNotes();
  };

  // Parallax effect for background
  const parallaxX = mousePosition.x * 0.02;
  const parallaxY = mousePosition.y * 0.02;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background with parallax */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-primary via-secondary to-primary animate-gradient-shift opacity-95"
        style={{
          transform: `translate(${parallaxX}px, ${parallaxY}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      />
      
      {/* Floating particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-40 w-80 h-80 bg-primary-glow/10 rounded-full blur-3xl animate-float animation-delay-2000" />
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-accent-orange/10 rounded-full blur-3xl animate-float animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10 container py-8 xl:py-12">
        {/* Header */}
        <div className="mb-8 xl:mb-12 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/20 backdrop-blur-sm flex items-center justify-center shadow-glow">
              <Clock className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-5xl xl:text-6xl font-bold text-white" dir="rtl">
              مركز تسليم الشفتات 🔄
            </h1>
            <div className="w-16 h-16 rounded-2xl bg-accent/20 backdrop-blur-sm flex items-center justify-center shadow-glow">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
          </div>
          <p className="text-white/90 text-xl xl:text-2xl font-medium" dir="rtl">
            تواصل ذكي بين فريق الصباح وفريق الليل (خلوا التسليم سلس 🌅🌙)
          </p>
        </div>

        {/* Main Layout: Creation Panel (Left) + Timeline (Right) */}
        <div className={`grid grid-cols-1 ${profile && canWrite(profile.role) ? 'xl:grid-cols-12' : 'xl:grid-cols-1'} gap-6 xl:gap-8`}>
          {/* Creation Panel - Left Side (Hidden for guest users) */}
          {profile && canWrite(profile.role) && (
            <div className="xl:col-span-5">
              <ShiftHandoverCreationPanel onNoteCreated={handleNoteCreated} />
            </div>
          )}

          {/* Timeline - Right Side */}
          <div className={profile && canWrite(profile.role) ? 'xl:col-span-7' : 'xl:col-span-12'}>
            <ShiftHandoverTimeline
              notes={notes}
              loading={loading}
              onNoteUpdated={handleNoteUpdated}
              onNoteDeleted={handleNoteDeleted}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
