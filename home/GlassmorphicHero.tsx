import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassmorphicHeroProps {
  children: ReactNode;
  className?: string;
  mouseX: number;
  mouseY: number;
}

export function GlassmorphicHero({ children, className, mouseX, mouseY }: GlassmorphicHeroProps) {
  const gradientX = (mouseX / window.innerWidth) * 100;
  const gradientY = (mouseY / window.innerHeight) * 100;

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{
        background: `radial-gradient(circle at ${gradientX}% ${gradientY}%, 
          hsl(var(--primary)) 0%, 
          hsl(var(--primary-glow)) 30%, 
          hsl(var(--accent-orange)) 100%)`,
        transition: 'background 0.3s ease-out',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/5 to-background/20" />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{
            background: 'hsl(var(--accent))',
            left: `${gradientX}%`,
            top: `${gradientY}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.3s ease-out',
          }}
        />
        <div
          className="absolute w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{
            background: 'hsl(var(--accent-orange))',
            left: `${100 - gradientX}%`,
            top: `${100 - gradientY}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.3s ease-out',
          }}
        />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
