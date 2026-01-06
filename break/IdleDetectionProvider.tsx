import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

interface IdleDetectionContextType {
  isIdle: boolean;
  idleBreakId: string | null;
  lastActivity: Date;
}

const IdleDetectionContext = createContext<IdleDetectionContextType | undefined>(undefined);

const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

export function IdleDetectionProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [isIdle, setIsIdle] = useState(false);
  const [idleBreakId, setIdleBreakId] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState(new Date());
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const idleStartTimeRef = useRef<Date | null>(null);

  const resetIdleTimer = () => {
    const now = new Date();
    setLastActivity(now);

    // If user was idle and had an auto-break, end it
    if (isIdle && idleBreakId && user) {
      endAutoIdleBreak();
    }

    setIsIdle(false);

    // Clear existing timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // Set new timer
    idleTimerRef.current = setTimeout(() => {
      startIdleDetection();
    }, IDLE_THRESHOLD);
  };

  const startIdleDetection = async () => {
    if (!user || !profile) return;

    // Don't start idle break if user is admin
    if (profile.role === 'admin') return;

    setIsIdle(true);
    idleStartTimeRef.current = new Date();

    try {
      // Call RPC to start auto-idle break
      const { data, error } = await supabase.rpc('start_auto_idle_break', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error starting auto-idle break:', error);
        return;
      }

      if (data) {
        setIdleBreakId(data);
      }
    } catch (error) {
      console.error('Error in idle detection:', error);
    }
  };

  const endAutoIdleBreak = async () => {
    if (!idleBreakId || !idleStartTimeRef.current) return;

    try {
      const idleDuration = Math.floor(
        (new Date().getTime() - idleStartTimeRef.current.getTime()) / 60000
      );

      // End the break
      const { error } = await supabase
        .from('breaks')
        .update({
          end_time: new Date().toISOString(),
          duration_minutes: idleDuration,
          updated_at: new Date().toISOString(),
        })
        .eq('id', idleBreakId);

      if (error) {
        console.error('Error ending auto-idle break:', error);
      } else {
        // Show notification to user
        toast.info(`You were idle for ${idleDuration} minute${idleDuration !== 1 ? 's' : ''}. This time has been recorded as a break.`, {
          duration: 5000,
        });
      }

      setIdleBreakId(null);
      idleStartTimeRef.current = null;
    } catch (error) {
      console.error('Error ending auto-idle break:', error);
    }
  };

  useEffect(() => {
    // Only track activity for logged-in non-admin users
    if (!user || !profile || profile.role === 'admin') {
      return;
    }

    // Activity event handlers
    const handleActivity = () => {
      resetIdleTimer();
    };

    // Listen to various user activity events
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Start initial timer
    resetIdleTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [user, profile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isIdle && idleBreakId) {
        endAutoIdleBreak();
      }
    };
  }, [isIdle, idleBreakId]);

  return (
    <IdleDetectionContext.Provider value={{ isIdle, idleBreakId, lastActivity }}>
      {children}
    </IdleDetectionContext.Provider>
  );
}

export function useIdleDetection() {
  const context = useContext(IdleDetectionContext);
  if (context === undefined) {
    throw new Error('useIdleDetection must be used within an IdleDetectionProvider');
  }
  return context;
}
