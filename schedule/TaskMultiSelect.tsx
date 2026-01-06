import { useState, useRef, useEffect } from 'react';
import { Check, X, Search, ChevronDown } from 'lucide-react';
import { TaskType } from '@/types/types';
import { cn } from '@/lib/utils';

interface TaskMultiSelectProps {
  value: TaskType[];
  onChange: (tasks: TaskType[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

const TASK_OPTIONS: TaskType[] = ['Call', 'Live Chat', 'WhatsApp', 'Partoo', 'Social'];

const TASK_COLORS: Record<TaskType, { bg: string; text: string; border: string; hover: string }> = {
  'Call': {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-400/40',
    hover: 'hover:bg-blue-500/30'
  },
  'Live Chat': {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-400/40',
    hover: 'hover:bg-green-500/30'
  },
  'WhatsApp': {
    bg: 'bg-teal-500/20',
    text: 'text-teal-400',
    border: 'border-teal-400/40',
    hover: 'hover:bg-teal-500/30'
  },
  'Partoo': {
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-400/40',
    hover: 'hover:bg-purple-500/30'
  },
  'Social': {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-400/40',
    hover: 'hover:bg-orange-500/30'
  }
};

export function TaskMultiSelect({ value, onChange, disabled, placeholder = 'Select tasks...' }: TaskMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = TASK_OPTIONS.filter(task =>
    task.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleTask = (task: TaskType) => {
    if (value.includes(task)) {
      onChange(value.filter(t => t !== task));
    } else {
      onChange([...value, task]);
    }
  };

  const removeTask = (task: TaskType, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(t => t !== task));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Input Area */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full min-h-[42px] px-3 py-2 rounded-lg border-2 transition-all duration-300",
          "backdrop-blur-sm bg-white/5 border-white/10",
          "hover:border-amber-400/50 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isOpen && "border-amber-400/50 ring-2 ring-amber-400/20"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {value.length === 0 ? (
              <span className="text-muted-foreground text-sm">{placeholder}</span>
            ) : (
              value.map(task => (
                <TaskPill
                  key={task}
                  task={task}
                  onRemove={(e) => removeTask(task, e)}
                  disabled={disabled}
                />
              ))
            )}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-300",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 rounded-xl border-2 border-amber-400/30 backdrop-blur-xl bg-[#2d1319]/95 shadow-2xl shadow-amber-500/20 animate-fade-in">
          {/* Search Bar */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-muted-foreground text-sm">
                No tasks found
              </div>
            ) : (
              filteredOptions.map(task => {
                const isSelected = value.includes(task);
                const colors = TASK_COLORS[task];

                return (
                  <button
                    key={task}
                    type="button"
                    onClick={() => toggleTask(task)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200",
                      "hover:bg-white/10",
                      isSelected && "bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200",
                          isSelected
                            ? `${colors.bg} ${colors.border}`
                            : "border-white/20 bg-white/5"
                        )}
                      >
                        {isSelected && (
                          <Check className={cn("h-3 w-3", colors.text)} />
                        )}
                      </div>
                      <span className={cn(
                        "font-medium transition-colors duration-200",
                        isSelected ? colors.text : "text-white"
                      )}>
                        {task}
                      </span>
                    </div>
                    {isSelected && (
                      <div className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold",
                        colors.bg,
                        colors.text
                      )}>
                        Selected
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {value.length > 0 && (
            <div className="p-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {value.length} task{value.length !== 1 ? 's' : ''} selected
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors duration-200"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskPill({ task, onRemove, disabled }: { task: TaskType; onRemove: (e: React.MouseEvent) => void; disabled?: boolean }) {
  const colors = TASK_COLORS[task];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-200",
        colors.bg,
        colors.text,
        colors.border,
        "animate-fade-in"
      )}
    >
      <span className="text-xs font-semibold">{task}</span>
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            "hover:scale-110 transition-transform duration-200",
            colors.hover,
            "rounded-full p-0.5"
          )}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function TaskTag({ task, size = 'sm', showTooltip = true }: { task: TaskType; size?: 'xs' | 'sm' | 'md'; showTooltip?: boolean }) {
  const colors = TASK_COLORS[task];
  
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border font-semibold transition-all duration-200 hover:scale-103",
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size]
      )}
      title={showTooltip ? task : undefined}
    >
      {task}
    </div>
  );
}

export { TASK_COLORS };
