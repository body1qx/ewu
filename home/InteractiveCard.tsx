import { useRef, useState, useEffect, type ReactNode, type CSSProperties } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

export function InteractiveCard({ children, className, onClick, style }: InteractiveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isMobile) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateXValue = ((y - centerY) / centerY) * -10;
    const rotateYValue = ((x - centerX) / centerX) * 10;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const transformStyle = isMobile
    ? {}
    : {
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${
          isHovered ? 'translateZ(20px) scale(1.02)' : 'translateZ(0) scale(1)'
        }`,
        transformStyle: 'preserve-3d' as const,
      };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
      className={cn('relative transition-all duration-300 ease-out', className)}
      style={{
        ...style,
        ...transformStyle,
      }}
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          'shadow-elegant hover:shadow-glow',
          'border-border/50',
          isHovered && 'border-accent/50'
        )}
      >
        {isHovered && (
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${rotateY * 5 + 50}% ${
                rotateX * 5 + 50
              }%, hsl(var(--accent)) 0%, transparent 70%)`,
            }}
          />
        )}
        {children}
      </Card>
    </div>
  );
}
