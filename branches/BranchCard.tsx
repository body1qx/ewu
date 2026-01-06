import { useState, useRef } from 'react';
import { MapPin, Clock, Car, Phone, Mail, User, CircleCheck, CircleX, Building2, Images } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Branch } from '@/types/types';
import { cn } from '@/lib/utils';
import { formatTo12Hour, getCurrentSaudiDay, isWithinOperatingHours } from '@/lib/timeUtils';

interface BranchCardProps {
  branch: Branch;
  onClick: () => void;
}

const statusConfig = {
  open: { label: 'مفتوح', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
  temporarily_closed: { label: 'مغلق مؤقتاً', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  under_renovation: { label: 'قيد التجديد', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  permanent_closed: { label: 'مغلق نهائياً', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
};

const isOpenNow = (branch: Branch): boolean => {
  // Only check if branch status is 'open'
  if (branch.status !== 'open') {
    return false;
  }

  // 24-hour branches are always open if status is 'open'
  if (branch.is_24_hours) {
    return true;
  }

  // Get current day in Saudi Arabia timezone
  const currentDay = getCurrentSaudiDay();
  const isFriday = currentDay === 5;
  
  const openTime = isFriday ? branch.opening_time_in_friday : branch.opening_time;
  const closeTime = isFriday ? branch.closing_time_in_friday : branch.closing_time;
  
  return isWithinOperatingHours(openTime, closeTime);
};

export function BranchCard({ branch, onClick }: BranchCardProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const isOpen = isOpenNow(branch);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const tiltX = ((y - centerY) / centerY) * -10;
    const tiltY = ((x - centerX) / centerX) * 10;
    
    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const statusInfo = statusConfig[branch.status];
  const isFriday = getCurrentSaudiDay() === 5;
  const openTime = isFriday ? branch.opening_time_in_friday : branch.opening_time;
  const closeTime = isFriday ? branch.closing_time_in_friday : branch.closing_time;

  // جمع جميع الصور المتاحة
  const allImages = [
    ...(branch.image_url ? [branch.image_url] : []),
    ...(branch.images?.map(img => img.image_url) || [])
  ].filter((url, index, self) => url && self.indexOf(url) === index); // إزالة التكرار

  const hasMultipleImages = allImages.length > 1;

  return (
    <Card
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all duration-300",
        "hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2",
        "bg-card/50 backdrop-blur-sm border-border/50"
      )}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.x || tilt.y ? 1.02 : 1})`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* عرض الصور */}
      {allImages.length > 0 ? (
        <div className="relative h-48 w-full overflow-hidden">
          {/* الصورة الرئيسية */}
          <img
            src={allImages[0]}
            alt={branch.branch_name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          
          {/* معرض الصور المصغرة */}
          {hasMultipleImages && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              {allImages.slice(1, 4).map((img, idx) => (
                <div
                  key={idx}
                  className="w-12 h-12 rounded-md overflow-hidden border-2 border-background/80 backdrop-blur-sm"
                >
                  <img
                    src={img}
                    alt={`${branch.branch_name} ${idx + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {allImages.length > 4 && (
                <div className="w-12 h-12 rounded-md overflow-hidden border-2 border-background/80 backdrop-blur-sm bg-background/80 flex items-center justify-center">
                  <span className="text-xs font-bold">+{allImages.length - 4}</span>
                </div>
              )}
            </div>
          )}

          {/* أيقونة الصور المتعددة */}
          {hasMultipleImages && (
            <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
              <Images className="h-3 w-3" />
              <span className="text-xs font-medium">{allImages.length}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      ) : (
        <div className="relative h-48 w-full overflow-hidden bg-muted/20 flex items-center justify-center">
          <Building2 className="h-16 w-16 text-muted-foreground/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}

      <div className="relative p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="font-mono text-base font-bold px-3 py-1">
                {branch.branch_code}
              </Badge>
              {branch.is_24_hours && (
                <Badge variant="default" className="text-xs gap-1 bg-green-600">
                  <Clock className="h-3 w-3" />
                  24 ساعة
                </Badge>
              )}
              {branch.has_drive_thru && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Car className="h-3 w-3" />
                  خدمة السيارات
                </Badge>
              )}
              {branch.is_franchise && (
                <Badge variant="default" className="text-xs">
                  فرنشايز
                </Badge>
              )}
            </div>
            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {branch.branch_name}
            </h3>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{branch.city}{branch.street ? `, ${branch.street}` : ''}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>
              {branch.is_24_hours ? '24 ساعة' : `${formatTo12Hour(openTime)} - ${formatTo12Hour(closeTime)}`}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <Badge className={statusInfo.className}>
            {statusInfo.label}
          </Badge>
          
          {branch.status === 'open' && (
            <div className="flex items-center gap-1.5">
              {isOpen ? (
                <>
                  <CircleCheck className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-green-600">مفتوح الآن</span>
                </>
              ) : (
                <>
                  <CircleX className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-medium text-red-600">مغلق الآن</span>
                </>
              )}
            </div>
          )}
        </div>

        {(branch.store_manager_name || branch.area_manager_name) && (
          <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
            {branch.store_manager_phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
              </div>
            )}
            {branch.store_manager_email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
              </div>
            )}
            {branch.store_manager_name && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Card>
  );
}
