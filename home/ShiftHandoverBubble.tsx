import { Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ShiftHandoverNote } from '@/types/types';
import { useState } from 'react';

interface ShiftHandoverBubbleProps {
  note: ShiftHandoverNote;
  onClick: () => void;
  isNew: boolean;
  index: number;
}

export default function ShiftHandoverBubble({ note, onClick, isNew, index }: ShiftHandoverBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return AlertCircle;
      case 'high':
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          gradient: 'from-red-500 to-red-600',
          glow: 'shadow-[0_0_30px_rgba(239,68,68,0.5)]',
          border: 'border-red-400',
        };
      case 'high':
        return {
          gradient: 'from-accent-orange to-accent',
          glow: 'shadow-[0_0_30px_rgba(255,183,0,0.5)]',
          border: 'border-accent',
        };
      default:
        return {
          gradient: 'from-accent to-primary-glow',
          glow: 'shadow-[0_0_20px_rgba(255,183,0,0.3)]',
          border: 'border-accent/50',
        };
    }
  };

  const getShiftLabel = (shiftType: string) => {
    switch (shiftType) {
      case 'morning':
        return 'Morning';
      case 'afternoon':
        return 'Afternoon';
      case 'night':
        return 'Night';
      default:
        return 'General';
    }
  };

  const Icon = getPriorityIcon(note.priority);
  const colors = getPriorityColor(note.priority);

  return (
    <div className="relative flex-shrink-0 group">
      {/* NEW Badge */}
      {isNew && (
        <div className="absolute -top-2 -right-2 z-20">
          <Badge className="bg-green-500 text-white text-xs px-2 py-0.5 shadow-lg animate-pulse">
            NEW
          </Badge>
        </div>
      )}

      {/* Bubble */}
      <div
        className={`
          relative w-24 h-24 xl:w-28 xl:h-28 rounded-full cursor-pointer
          bg-gradient-to-br ${colors.gradient}
          border-2 ${colors.border}
          transition-all duration-300 ease-out
          ${isHovered ? `scale-125 ${colors.glow}` : 'scale-100'}
          animate-fade-in-up
        `}
        style={{ animationDelay: `${index * 100}ms` }}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-10 h-10 xl:w-12 xl:h-12 text-white drop-shadow-lg" />
        </div>

        {/* Pulse animation for urgent */}
        {note.priority === 'urgent' && (
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
        )}
      </div>

      {/* Label below bubble */}
      <div className="mt-3 text-center">
        <p className="text-white text-sm font-medium line-clamp-2 px-1">
          {note.title}
        </p>
        <p className="text-white/60 text-xs mt-1">
          {getShiftLabel(note.shift_type)}
        </p>
      </div>

      {/* Hover Tooltip */}
      {isHovered && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-4 w-72 p-4 bg-background border border-border rounded-lg shadow-2xl z-30 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm line-clamp-2">{note.title}</h4>
              <Badge className={`bg-gradient-to-r ${colors.gradient} text-white text-xs shrink-0`}>
                {note.priority.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{getShiftLabel(note.shift_type)} Shift</span>
              <span>•</span>
              <span>{note.creator?.full_name || 'Unknown'}</span>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-3">
              {note.content}
            </p>

            {note.follow_up_required && (
              <Badge variant="destructive" className="text-xs">
                Follow-up Required
              </Badge>
            )}
          </div>

          {/* Tooltip arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-border" />
        </div>
      )}
    </div>
  );
}
