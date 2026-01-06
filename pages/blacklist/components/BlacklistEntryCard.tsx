import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Phone, Mail, MapPin } from 'lucide-react';
import { BlacklistCustomerWithCreator } from '@/types/types';

interface BlacklistEntryCardProps {
  customer: BlacklistCustomerWithCreator;
  onViewDetails: (customer: BlacklistCustomerWithCreator) => void;
  onEdit?: (customer: BlacklistCustomerWithCreator) => void;
  getRiskBadgeColor: (risk: string) => string;
  getStatusBadgeColor: (status: string) => string;
}

const fraudTypeLabels: Record<string, string> = {
  fake_complaint: '😤 شكوى مبالغ فيها',
  repeated_compensation: '💰 طلبات تعويض متكررة',
  abusive_language: '🗣️ تعامل غير لائق',
  delivery_fraud: '🚗 مشاكل توصيل',
  refund_abuse: '💸 طلبات استرجاع كثيرة',
  other: '❓ أنواع أخرى'
};

const riskLevelLabels: Record<string, string> = {
  high: '🔔 مهم جداً',
  medium: '⚠️ مهم',
  low: '💡 عادي'
};

const statusLabels: Record<string, string> = {
  active: '🔴 نشط',
  under_review: '🔵 تحت المراجعة',
  cleared: '✅ تم الحل'
};

export default function BlacklistEntryCard({
  customer,
  onViewDetails,
  onEdit,
  getRiskBadgeColor,
  getStatusBadgeColor
}: BlacklistEntryCardProps) {
  // Get first image from attachments
  const firstImage = customer.attachment_links.find(link => 
    link.match(/\.(jpg|jpeg|png|webp)$/i)
  );

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50">
      <CardContent className="p-6 space-y-4">
        {/* Image Preview (if available) */}
        {firstImage && (
          <div className="w-full h-40 rounded-lg overflow-hidden bg-muted">
            <img
              src={firstImage}
              alt="صورة توضيحية"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header with Risk and Status */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-1" dir="rtl">
              {customer.customer_name || 'عميل مجهول 🤷'}
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className={getRiskBadgeColor(customer.risk_level)}>
                {riskLevelLabels[customer.risk_level] || customer.risk_level.toUpperCase()}
              </Badge>
              <Badge className={getStatusBadgeColor(customer.status)}>
                {statusLabels[customer.status] || customer.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-2 text-sm">
          {customer.phone_number && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span className="font-mono">{customer.phone_number}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span className="truncate">{customer.email}</span>
            </div>
          )}
          {(customer.branch || customer.city) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{[customer.branch, customer.city].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>

        {/* Fraud Types */}
        {customer.fraud_types.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {customer.fraud_types.slice(0, 3).map((type) => (
              <Badge key={type} variant="outline" className="text-xs">
                {fraudTypeLabels[type] || type}
              </Badge>
            ))}
            {customer.fraud_types.length > 3 && (
              <Badge variant="outline" className="text-xs" dir="rtl">
                +{customer.fraud_types.length - 3} أكثر
              </Badge>
            )}
          </div>
        )}

        {/* Description Preview */}
        {(customer.description_en || customer.description_ar) && (
          <p className="text-sm text-muted-foreground line-clamp-2" dir="rtl">
            {customer.description_ar || customer.description_en}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(customer)}
            className="flex-1 gap-2"
          >
            <Eye className="w-4 h-4" />
            <span dir="rtl">عرض التفاصيل</span>
          </Button>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(customer)}
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              <span dir="rtl">تعديل</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
