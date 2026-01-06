import { X, MapPin, Clock, Car, Phone, Mail, User, Edit, Trash2, AlertCircle, CircleCheck, CircleX, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ImageGallery } from '@/components/ui/image-gallery';
import type { Branch } from '@/types/types';
import { cn } from '@/lib/utils';
import { formatTo12Hour, getCurrentSaudiDay, isWithinOperatingHours } from '@/lib/timeUtils';
import { useState } from 'react';

interface BranchDetailModalProps {
  branch: Branch;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canManage: boolean;
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

export function BranchDetailModal({ branch, isOpen, onClose, onEdit, onDelete, canManage }: BranchDetailModalProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const statusInfo = statusConfig[branch.status];
  const isCurrentlyOpen = isOpenNow(branch);

  if (!isOpen) return null;

  const handleDelete = () => {
    setShowDeleteDialog(false);
    onDelete?.();
  };

  // جمع جميع الصور المتاحة
  const allImages = [
    ...(branch.image_url ? [branch.image_url] : []),
    ...(branch.images?.map(img => img.image_url) || [])
  ].filter((url, index, self) => url && self.indexOf(url) === index); // إزالة التكرار

  return (
    <>
      {/* الخلفية المعتمة */}
      <div 
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
          "animate-in fade-in duration-200"
        )}
        onClick={onClose}
      />
      
      {/* النافذة المركزية */}
      <div 
        className={cn(
          "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
          "w-[95vw] max-w-5xl max-h-[90vh]",
          "bg-background border border-border rounded-xl shadow-2xl",
          "overflow-hidden",
          "animate-in zoom-in-95 duration-300"
        )}
      >
        {/* المحتوى القابل للتمرير */}
        <div className="overflow-y-auto max-h-[90vh]">
          {/* الرأس الثابت */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="flex items-center justify-between p-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-base font-bold px-3 py-1">
                    {branch.branch_code}
                  </Badge>
                  {branch.is_24_hours && (
                    <Badge variant="default" className="gap-1 bg-green-600">
                      <Clock className="h-3 w-3" />
                      24 ساعة
                    </Badge>
                  )}
                  {branch.has_drive_thru && (
                    <Badge variant="secondary" className="gap-1">
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
                <h2 className="text-2xl font-bold text-foreground line-clamp-1">
                  {branch.branch_name}
                </h2>
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{branch.city}{branch.street ? `, ${branch.street}` : ''}</span>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {canManage && (
              <div className="flex gap-2 px-6 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  تعديل الفرع
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف
                </Button>
              </div>
            )}
          </div>

          {/* معرض الصور */}
          {allImages.length > 0 ? (
            <div className="p-6">
              <ImageGallery images={allImages} alt={branch.branch_name} />
            </div>
          ) : (
            <div className="relative h-64 w-full bg-muted/20 flex items-center justify-center">
              <Building2 className="h-24 w-24 text-muted-foreground/30" />
            </div>
          )}

          {/* التفاصيل */}
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 flex-wrap">
              <Badge className={cn("text-sm px-3 py-1", statusInfo.className)}>
                {statusInfo.label}
              </Badge>
              
              {branch.status === 'open' && (
                <div className="flex items-center gap-2">
                  {isCurrentlyOpen ? (
                    <>
                      <CircleCheck className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-600">مفتوح الآن</span>
                    </>
                  ) : (
                    <>
                      <CircleX className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium text-red-600">مغلق الآن</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* ساعات العمل */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-primary" />
                    ساعات العمل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {branch.is_24_hours ? (
                    <div className="flex justify-center items-center py-2">
                      <Badge variant="default" className="text-base gap-2 px-4 py-2 bg-green-600">
                        <Clock className="h-4 w-4" />
                        مفتوح 24 ساعة
                      </Badge>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">الأيام العادية</span>
                        <span className="font-medium">
                          {formatTo12Hour(branch.opening_time)} - {formatTo12Hour(branch.closing_time)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">يوم الجمعة</span>
                        <span className="font-medium">
                          {formatTo12Hour(branch.opening_time_in_friday)} - {formatTo12Hour(branch.closing_time_in_friday)}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* مدير الفرع */}
              {branch.store_manager_name && (
                <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-primary" />
                      مدير الفرع
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{branch.store_manager_name}</span>
                    </div>
                    {branch.store_manager_phone && (
                      <a
                        href={`tel:${branch.store_manager_phone}`}
                        className="flex items-center gap-2 text-primary hover:underline transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        <span>{branch.store_manager_phone}</span>
                      </a>
                    )}
                    {branch.store_manager_email && (
                      <a
                        href={`mailto:${branch.store_manager_email}`}
                        className="flex items-center gap-2 text-primary hover:underline transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        <span className="break-all">{branch.store_manager_email}</span>
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* مدير المنطقة */}
              {branch.area_manager_name && (
                <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-accent" />
                      مدير المنطقة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{branch.area_manager_name}</span>
                    </div>
                    {branch.area_manager_phone && (
                      <a
                        href={`tel:${branch.area_manager_phone}`}
                        className="flex items-center gap-2 text-accent hover:underline transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        <span>{branch.area_manager_phone}</span>
                      </a>
                    )}
                    {branch.area_manager_email && (
                      <a
                        href={`mailto:${branch.area_manager_email}`}
                        className="flex items-center gap-2 text-accent hover:underline transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        <span className="break-all">{branch.area_manager_email}</span>
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* ملاحظات إضافية */}
            {branch.notes && (
              <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    ملاحظات إضافية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {branch.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* مربع حوار التأكيد للحذف */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الفرع</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف <strong>{branch.branch_name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
