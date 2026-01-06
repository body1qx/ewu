import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { toast } from 'sonner';
import { useState } from 'react';
import { 
  Edit, 
  Archive, 
  Trash2,
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Link as LinkIcon,
  Calendar,
  User
} from 'lucide-react';
import { BlacklistCustomerWithCreator } from '@/types/types';
import { archiveBlacklistCustomer, deleteBlacklistCustomer } from '@/db/api';
import { format } from 'date-fns';

interface BlacklistDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: BlacklistCustomerWithCreator | null;
  canManage: boolean;
  onEdit: (customer: BlacklistCustomerWithCreator) => void;
  onSuccess: () => void;
  getRiskBadgeColor: (risk: string) => string;
  getStatusBadgeColor: (status: string) => string;
}

const fraudTypeLabels: Record<string, string> = {
  fake_complaint: 'Fake Complaint',
  repeated_compensation: 'Repeated Compensation',
  abusive_language: 'Abusive Language',
  delivery_fraud: 'Delivery Fraud',
  refund_abuse: 'Refund Abuse',
  other: 'Other'
};

export default function BlacklistDetailModal({
  open,
  onOpenChange,
  customer,
  canManage,
  onEdit,
  onSuccess,
  getRiskBadgeColor,
  getStatusBadgeColor
}: BlacklistDetailModalProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!customer) return null;

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this entry? It will be marked as cleared.')) {
      return;
    }

    try {
      await archiveBlacklistCustomer(customer.id);
      toast.success('Entry archived successfully');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error archiving entry:', error);
      toast.error('Failed to archive entry');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteBlacklistCustomer(customer.id);
      toast.success('Entry deleted permanently');
      setShowDeleteDialog(false);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Blacklist Entry Details</span>
              {canManage && customer.status !== 'cleared' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onEdit(customer);
                    }}
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleArchive}
                    className="gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Name and Badges */}
          <div>
            <h2 className="text-2xl font-bold mb-3">
              {customer.customer_name || 'Unknown Customer'}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Badge className={getRiskBadgeColor(customer.risk_level)}>
                {customer.risk_level.toUpperCase()} RISK
              </Badge>
              <Badge className={getStatusBadgeColor(customer.status)}>
                {customer.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {customer.phone_number && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono">{customer.phone_number}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.zoho_contact_id && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span>Zoho ID: {customer.zoho_contact_id}</span>
                </div>
              )}
              {(customer.branch || customer.city) && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{[customer.branch, customer.city].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Fraud Types */}
          {customer.fraud_types.length > 0 && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Fraud Types</h3>
                <div className="flex flex-wrap gap-2">
                  {customer.fraud_types.map((type) => (
                    <Badge key={type} variant="outline">
                      {fraudTypeLabels[type] || type}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Descriptions */}
          {(customer.description_en || customer.description_ar) && (
            <>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Description</h3>
                {customer.description_en && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">English</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">
                      {customer.description_en}
                    </p>
                  </div>
                )}
                {customer.description_ar && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Arabic (العربية)</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg" dir="rtl">
                      {customer.description_ar}
                    </p>
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Evidence */}
          {(customer.zoho_ticket_ids.length > 0 || customer.order_ids.length > 0 || customer.attachment_links.length > 0) && (
            <>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Evidence</h3>
                
                {customer.zoho_ticket_ids.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Zoho Ticket IDs</p>
                    <div className="flex flex-wrap gap-2">
                      {customer.zoho_ticket_ids.map((id, index) => (
                        <Badge key={index} variant="secondary" className="font-mono">
                          {id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {customer.order_ids.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Order IDs</p>
                    <div className="flex flex-wrap gap-2">
                      {customer.order_ids.map((id, index) => (
                        <Badge key={index} variant="secondary" className="font-mono">
                          {id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {customer.attachment_links.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Evidence Files</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {customer.attachment_links.map((link, index) => {
                        const isImage = link.match(/\.(jpg|jpeg|png|webp)$/i);
                        const isPDF = link.match(/\.pdf$/i);
                        const fileName = link.split('/').pop() || `File ${index + 1}`;

                        return (
                          <div
                            key={index}
                            className="relative group rounded-lg overflow-hidden border border-border bg-muted"
                          >
                            {isImage ? (
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block aspect-square"
                              >
                                <img
                                  src={link}
                                  alt={fileName}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                                />
                              </a>
                            ) : (
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="aspect-square flex flex-col items-center justify-center p-4 hover:bg-muted/80 transition-colors"
                              >
                                <FileText className="w-12 h-12 text-primary mb-2" />
                                <span className="text-xs text-center font-medium truncate w-full px-2">
                                  {isPDF ? 'PDF Document' : 'File'}
                                </span>
                              </a>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                              {fileName}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Metadata */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span>{format(new Date(customer.created_at), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Updated:</span>
                <span>{format(new Date(customer.updated_at), 'MMM dd, yyyy')}</span>
              </div>
              {customer.creator && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created by:</span>
                  <span className="truncate">{customer.creator.full_name || customer.creator.email || 'Unknown'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the blacklist entry
            and remove all associated data from the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
