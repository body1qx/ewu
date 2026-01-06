import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { createBlacklistCustomer, updateBlacklistCustomer, uploadBlacklistEvidence, deleteBlacklistEvidence } from '@/db/api';
import { BlacklistCustomer, FraudType } from '@/types/types';

interface BlacklistEntryFormProps {
  customer: BlacklistCustomer | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const fraudTypeOptions: { value: FraudType; label: string }[] = [
  { value: 'fake_complaint', label: 'Fake Complaint' },
  { value: 'repeated_compensation', label: 'Repeated Compensation' },
  { value: 'abusive_language', label: 'Abusive Language' },
  { value: 'delivery_fraud', label: 'Delivery Fraud' },
  { value: 'refund_abuse', label: 'Refund Abuse' },
  { value: 'other', label: 'Other' }
];

export default function BlacklistEntryForm({
  customer,
  onSuccess,
  onCancel
}: BlacklistEntryFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; path: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    email: '',
    zoho_contact_id: '',
    branch: '',
    city: '',
    fraud_types: [] as string[],
    description_en: '',
    description_ar: '',
    zoho_ticket_ids: '',
    order_ids: '',
    attachment_links: '',
    risk_level: 'medium',
    status: 'active'
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        customer_name: customer.customer_name || '',
        phone_number: customer.phone_number || '',
        email: customer.email || '',
        zoho_contact_id: customer.zoho_contact_id || '',
        branch: customer.branch || '',
        city: customer.city || '',
        fraud_types: customer.fraud_types || [],
        description_en: customer.description_en || '',
        description_ar: customer.description_ar || '',
        zoho_ticket_ids: customer.zoho_ticket_ids.join(', ') || '',
        order_ids: customer.order_ids.join(', ') || '',
        attachment_links: customer.attachment_links.join('\n') || '',
        risk_level: customer.risk_level,
        status: customer.status
      });
    }
  }, [customer]);

  const handleFraudTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      fraud_types: prev.fraud_types.includes(type)
        ? prev.fraud_types.filter(t => t !== type)
        : [...prev.fraud_types, type]
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate file size (max 5MB per file)
    const maxSize = 5 * 1024 * 1024; // 5MB
    for (const file of Array.from(files)) {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} exceeds 5MB limit`);
        return;
      }

      // Validate filename - no Chinese characters
      if (/[\u4e00-\u9fa5]/.test(file.name)) {
        toast.error(`Filename "${file.name}" contains Chinese characters. Please use English filenames only.`);
        return;
      }
    }

    // If editing existing customer, use their ID, otherwise use temporary ID
    const tempId = customer?.id || 'temp_' + Date.now();

    setUploadingFiles(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const result = await uploadBlacklistEvidence(tempId, file);
        return { ...result, name: file.name };
      });

      const results = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...results]);

      // Add URLs to attachment_links
      const newLinks = results.map(r => r.url).join('\n');
      setFormData(prev => ({
        ...prev,
        attachment_links: prev.attachment_links
          ? prev.attachment_links + '\n' + newLinks
          : newLinks
      }));

      toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploadingFiles(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveFile = async (index: number) => {
    const file = uploadedFiles[index];
    try {
      await deleteBlacklistEvidence(file.path);
      setUploadedFiles(prev => prev.filter((_, i) => i !== index));

      // Remove URL from attachment_links
      setFormData(prev => ({
        ...prev,
        attachment_links: prev.attachment_links
          .split('\n')
          .filter(link => link.trim() !== file.url)
          .join('\n')
      }));

      toast.success('File removed successfully');
    } catch (error) {
      console.error('Error removing file:', error);
      toast.error('Failed to remove file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.phone_number && !formData.email && !formData.zoho_contact_id) {
      toast.error('Please provide at least one identifier (phone, email, or Zoho ID)');
      return;
    }

    if (!formData.description_en && !formData.description_ar) {
      toast.error('Please provide a description in English or Arabic');
      return;
    }

    if (formData.fraud_types.length === 0) {
      toast.error('Please select at least one fraud type');
      return;
    }

    try {
      setLoading(true);

      const data = {
        customer_name: formData.customer_name || undefined,
        phone_number: formData.phone_number || undefined,
        email: formData.email || undefined,
        zoho_contact_id: formData.zoho_contact_id || undefined,
        branch: formData.branch || undefined,
        city: formData.city || undefined,
        fraud_types: formData.fraud_types,
        description_en: formData.description_en || undefined,
        description_ar: formData.description_ar || undefined,
        zoho_ticket_ids: formData.zoho_ticket_ids
          ? formData.zoho_ticket_ids.split(',').map(id => id.trim()).filter(Boolean)
          : [],
        order_ids: formData.order_ids
          ? formData.order_ids.split(',').map(id => id.trim()).filter(Boolean)
          : [],
        attachment_links: formData.attachment_links
          ? formData.attachment_links.split('\n').map(link => link.trim()).filter(Boolean)
          : [],
        risk_level: formData.risk_level,
        status: formData.status
      };

      if (customer) {
        await updateBlacklistCustomer(customer.id, data);
        toast.success('Blacklist entry updated successfully');
      } else {
        await createBlacklistCustomer(data);
        toast.success('Blacklist entry created successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving blacklist entry:', error);
      toast.error('Failed to save blacklist entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Customer Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customer_name">Customer Name (Optional)</Label>
            <Input
              id="customer_name"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              placeholder="Enter customer name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number *</Label>
            <Input
              id="phone_number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="+966XXXXXXXXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="customer@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zoho_contact_id">Zoho Contact ID *</Label>
            <Input
              id="zoho_contact_id"
              value={formData.zoho_contact_id}
              onChange={(e) => setFormData({ ...formData, zoho_contact_id: e.target.value })}
              placeholder="Enter Zoho contact ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch">Branch (Optional)</Label>
            <Input
              id="branch"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              placeholder="Enter branch name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City (Optional)</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Enter city"
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          * At least one identifier (phone, email, or Zoho ID) is required
        </p>
      </div>

      {/* Fraud Types */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Fraud Types *</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fraudTypeOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={option.value}
                checked={formData.fraud_types.includes(option.value)}
                onCheckedChange={() => handleFraudTypeToggle(option.value)}
              />
              <Label htmlFor={option.value} className="cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Descriptions */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Description *</h3>
        
        <div className="space-y-2">
          <Label htmlFor="description_en">Description (English)</Label>
          <Textarea
            id="description_en"
            value={formData.description_en}
            onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
            placeholder="Detailed description of the fraud case in English..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description_ar">الوصف (Arabic)</Label>
          <Textarea
            id="description_ar"
            value={formData.description_ar}
            onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
            placeholder="وصف تفصيلي لحالة الاحتيال بالعربية..."
            rows={4}
            dir="rtl"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          * At least one description (English or Arabic) is required
        </p>
      </div>

      {/* Evidence */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Evidence (Optional)</h3>
        
        <div className="space-y-2">
          <Label htmlFor="zoho_ticket_ids">Zoho Ticket IDs (comma-separated)</Label>
          <Input
            id="zoho_ticket_ids"
            value={formData.zoho_ticket_ids}
            onChange={(e) => setFormData({ ...formData, zoho_ticket_ids: e.target.value })}
            placeholder="123456, 789012, 345678"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="order_ids">Order IDs (comma-separated)</Label>
          <Input
            id="order_ids"
            value={formData.order_ids}
            onChange={(e) => setFormData({ ...formData, order_ids: e.target.value })}
            placeholder="ORD-001, ORD-002, ORD-003"
          />
        </div>

        <div className="space-y-2">
          <Label>Evidence Files (Images/PDFs)</Label>
          <div className="space-y-3">
            {/* File Upload Button */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="file-upload"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                onChange={handleFileUpload}
                disabled={uploadingFiles}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={uploadingFiles}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {uploadingFiles ? 'Uploading...' : 'Upload Files'}
              </Button>
              <span className="text-sm text-muted-foreground">
                Max 5MB per file. Images (JPG, PNG, WebP) or PDF only.
              </span>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedFiles.map((file, index) => {
                  const isImage = file.name.match(/\.(jpg|jpeg|png|webp)$/i);
                  return (
                    <div
                      key={index}
                      className="relative group rounded-lg overflow-hidden border border-border bg-muted"
                    >
                      {isImage ? (
                        <div className="aspect-square">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square flex flex-col items-center justify-center p-4">
                          <FileText className="w-12 h-12 text-primary mb-2" />
                          <span className="text-xs text-center font-medium truncate w-full px-2">
                            {file.name}
                          </span>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity gap-1 h-7 px-2"
                      >
                        <X className="w-3 h-3" />
                        Remove
                      </Button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                        {file.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Manual Links Input (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="attachment_links" className="text-sm text-muted-foreground">
                Or paste external links (one per line)
              </Label>
              <Textarea
                id="attachment_links"
                value={formData.attachment_links}
                onChange={(e) => setFormData({ ...formData, attachment_links: e.target.value })}
                placeholder="https://example.com/file1.pdf&#10;https://example.com/file2.pdf"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Risk Level and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="risk_level">Risk Level *</Label>
          <Select value={formData.risk_level} onValueChange={(value) => setFormData({ ...formData, risk_level: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="cleared">Cleared</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : customer ? 'Update Entry' : 'Create Entry'}
        </Button>
      </div>
    </form>
  );
}
