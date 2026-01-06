import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { Branch, BranchStatus } from '@/types/types';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/db/supabase';
import { useToast } from '@/hooks/use-toast';
import { addBranchImages } from '@/db/api';

// Helper function to format time to HH:MM format
const formatTimeToHHMM = (time: string): string => {
  if (!time) return '';
  // If time includes seconds (HH:MM:SS), remove them
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return time;
};

const branchFormSchema = z.object({
  branch_code: z.string().min(1, 'Branch code is required'),
  branch_name: z.string().min(1, 'Branch name is required'),
  city: z.string().min(1, 'City is required'),
  street: z.string().optional(),
  has_drive_thru: z.boolean(),
  is_franchise: z.boolean(),
  is_24_hours: z.boolean(),
  opening_time: z.string().optional().or(z.literal('')),
  closing_time: z.string().optional().or(z.literal('')),
  opening_time_in_friday: z.string().optional().or(z.literal('')),
  closing_time_in_friday: z.string().optional().or(z.literal('')),
  status: z.enum(['open', 'temporarily_closed', 'under_renovation', 'permanent_closed']),
  store_manager_name: z.string().optional(),
  store_manager_phone: z.string().optional(),
  store_manager_email: z.string().email('Invalid email').optional().or(z.literal('')),
  area_manager_name: z.string().optional(),
  area_manager_phone: z.string().optional(),
  area_manager_email: z.string().email('Invalid email').optional().or(z.literal('')),
  notes: z.string().optional(),
  image_url: z.string().optional(),
}).refine((data) => {
  // If not 24 hours, time fields are required and must be valid
  if (!data.is_24_hours) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return (
      data.opening_time && timeRegex.test(data.opening_time) &&
      data.closing_time && timeRegex.test(data.closing_time) &&
      data.opening_time_in_friday && timeRegex.test(data.opening_time_in_friday) &&
      data.closing_time_in_friday && timeRegex.test(data.closing_time_in_friday)
    );
  }
  return true;
}, {
  message: 'All time fields are required and must be in HH:MM format when not operating 24 hours',
  path: ['opening_time'],
});

type BranchFormValues = z.infer<typeof branchFormSchema>;

interface BranchFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BranchFormValues) => Promise<void>;
  initialData?: Branch;
  isLoading?: boolean;
}

export function BranchForm({ isOpen, onClose, onSubmit, initialData, isLoading }: BranchFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]); // Track current existing images
  const [originalImageUrls, setOriginalImageUrls] = useState<string[]>([]); // Track original images for deletion
  const [uploadingImages, setUploadingImages] = useState(false);

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: {
      branch_code: '',
      branch_name: '',
      city: '',
      street: '',
      has_drive_thru: false,
      is_franchise: false,
      is_24_hours: false,
      opening_time: '10:00',
      closing_time: '23:00',
      opening_time_in_friday: '13:00',
      closing_time_in_friday: '23:30',
      status: 'open',
      store_manager_name: '',
      store_manager_phone: '',
      store_manager_email: '',
      area_manager_name: '',
      area_manager_phone: '',
      area_manager_email: '',
      notes: '',
      image_url: '',
    },
  });

  // Handle multiple image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles: File[] = [];
    const previews: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'نوع ملف غير صالح',
          description: 'يرجى اختيار ملفات صور فقط (JPEG, PNG, أو WebP)',
          variant: 'destructive',
        });
        continue;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'حجم الملف كبير جداً',
          description: `الملف ${file.name} يتجاوز 5 ميجابايت`,
          variant: 'destructive',
        });
        continue;
      }

      validFiles.push(file);
    }

    // Check total number of images (existing + new)
    const totalImages = existingImageUrls.length + imageFiles.length + validFiles.length;
    if (totalImages > 10) {
      toast({
        title: 'عدد الصور كبير جداً',
        description: `يمكنك رفع 10 صور كحد أقصى. لديك حالياً ${existingImageUrls.length + imageFiles.length} صور`,
        variant: 'destructive',
      });
      return;
    }

    // Create previews for new files
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === validFiles.length) {
          // Append new previews to existing ones
          setImagePreviews(prev => [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Append new files to existing files
    setImageFiles(prev => [...prev, ...validFiles]);
  };

  // Upload multiple images to Supabase Storage
  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('branch-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('branch-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: 'فشل الرفع',
        description: 'فشل رفع صور الفرع. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  // Remove image from selection
  const handleRemoveImage = (index: number) => {
    const imageToRemove = imagePreviews[index];
    
    // Check if this is an existing image or a new one
    const existingIndex = existingImageUrls.indexOf(imageToRemove);
    
    if (existingIndex !== -1) {
      // It's an existing image - remove from existingImageUrls
      setExistingImageUrls(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      // It's a new image - find and remove from imageFiles
      const newImageIndex = index - existingImageUrls.length;
      if (newImageIndex >= 0) {
        setImageFiles(prev => prev.filter((_, i) => i !== newImageIndex));
      }
    }
    
    // Remove from previews
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Remove all images
  const handleRemoveAllImages = () => {
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImageUrls([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        branch_code: initialData.branch_code,
        branch_name: initialData.branch_name,
        city: initialData.city,
        street: initialData.street || '',
        has_drive_thru: initialData.has_drive_thru,
        is_franchise: initialData.is_franchise,
        is_24_hours: initialData.is_24_hours,
        opening_time: formatTimeToHHMM(initialData.opening_time),
        closing_time: formatTimeToHHMM(initialData.closing_time),
        opening_time_in_friday: formatTimeToHHMM(initialData.opening_time_in_friday),
        closing_time_in_friday: formatTimeToHHMM(initialData.closing_time_in_friday),
        status: initialData.status,
        store_manager_name: initialData.store_manager_name || '',
        store_manager_phone: initialData.store_manager_phone || '',
        store_manager_email: initialData.store_manager_email || '',
        area_manager_name: initialData.area_manager_name || '',
        area_manager_phone: initialData.area_manager_phone || '',
        area_manager_email: initialData.area_manager_email || '',
        notes: initialData.notes || '',
        image_url: initialData.image_url || '',
      });
      
      // Collect existing images from both image_url and images array
      const existingImages = [
        ...(initialData.image_url ? [initialData.image_url] : []),
        ...(initialData.images?.map(img => img.image_url) || [])
      ].filter((url, index, self) => url && self.indexOf(url) === index);
      
      // Store both original and current existing images
      setOriginalImageUrls(existingImages); // Store original for deletion tracking
      setExistingImageUrls(existingImages); // Store current for editing
      
      // Show existing images in preview
      if (existingImages.length > 0) {
        setImagePreviews(existingImages);
      }
      
      // Clear new image files (we're editing, not creating)
      setImageFiles([]);
    } else {
      // Reset to default values when creating new branch
      form.reset({
        branch_code: '',
        branch_name: '',
        city: '',
        street: '',
        has_drive_thru: false,
        is_franchise: false,
        is_24_hours: false,
        opening_time: '10:00',
        closing_time: '23:00',
        opening_time_in_friday: '13:00',
        closing_time_in_friday: '23:30',
        status: 'open',
        store_manager_name: '',
        store_manager_phone: '',
        store_manager_email: '',
        area_manager_name: '',
        area_manager_phone: '',
        area_manager_email: '',
        notes: '',
        image_url: '',
      });
      setImageFiles([]);
      setImagePreviews([]);
      setExistingImageUrls([]);
      setOriginalImageUrls([]);
    }
  }, [initialData, form]);

  const handleSubmit = async (data: BranchFormValues) => {
    try {
      // Upload ONLY new images if any were selected
      let newlyUploadedImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        console.log('📤 رفع', imageFiles.length, 'صور جديدة...');
        newlyUploadedImageUrls = await uploadImages();
        console.log('✅ تم رفع', newlyUploadedImageUrls.length, 'صور جديدة بنجاح');
      }
      
      // Combine existing images with newly uploaded ones
      const allImageUrls = [...existingImageUrls, ...newlyUploadedImageUrls];
      console.log('📋 إجمالي الصور:', {
        existing: existingImageUrls.length,
        new: newlyUploadedImageUrls.length,
        total: allImageUrls.length
      });
      
      // Set the first image as the main image_url (prefer existing if available)
      if (allImageUrls.length > 0) {
        data.image_url = allImageUrls[0];
      }
      
      // Pass information about images to parent component
      if (initialData) {
        // For editing: calculate which images were deleted
        const deletedImages = originalImageUrls.filter(url => !existingImageUrls.includes(url));
        
        if (deletedImages.length > 0) {
          (data as any).deletedImages = deletedImages;
          console.log('🗑️ صور محذوفة:', deletedImages.length);
        }
        
        // Pass NEW images to be added
        if (newlyUploadedImageUrls.length > 0) {
          (data as any).newImages = newlyUploadedImageUrls;
          console.log('➕ صور جديدة للإضافة:', newlyUploadedImageUrls.length);
        }
        
        // Pass the list of images to keep
        (data as any).keepImages = existingImageUrls;
        console.log('✅ صور محفوظة:', existingImageUrls.length);
      } else {
        // For creating: pass all images
        if (allImageUrls.length > 0) {
          (data as any).allImages = allImageUrls;
          console.log('📋 جميع الصور للفرع الجديد:', allImageUrls.length);
          
          if (allImageUrls.length > 1) {
            (data as any).additionalImages = allImageUrls.slice(1);
          }
        }
      }
      
      // Submit the branch data
      await onSubmit(data);

      // Reset form
      form.reset();
      setImageFiles([]);
      setImagePreviews([]);
      setExistingImageUrls([]);
      setOriginalImageUrls([]);
    } catch (error) {
      console.error('❌ خطأ في إرسال النموذج:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
          "animate-in fade-in duration-200"
        )}
        onClick={onClose}
      />
      
      <div 
        className={cn(
          "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
          "w-full max-w-4xl max-h-[90vh]",
          "bg-background border border-border rounded-lg shadow-2xl",
          "overflow-hidden",
          "animate-in zoom-in-95 duration-200"
        )}
      >
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {initialData ? 'تعديل الفرع' : 'إضافة فرع جديد'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="branch_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., RYD-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="branch_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Shawarmer Olaya" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Riyadh" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., King Fahd Road" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="temporarily_closed">Temporarily Closed</SelectItem>
                            <SelectItem value="under_renovation">Under Renovation</SelectItem>
                            <SelectItem value="permanent_closed">Permanently Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="has_drive_thru"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Drive-Thru Available</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_franchise"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Franchise Branch</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_24_hours"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-primary/5">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Open 24 Hours</FormLabel>
                          <p className="text-sm text-muted-foreground">Branch operates 24/7</p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">صور الفرع</h3>
                <div className="space-y-4">
                  <FormItem>
                    <FormLabel>رفع صور الفرع (حتى 10 صور)</FormLabel>
                    <FormDescription>
                      قم برفع صور للفرع (JPEG, PNG, أو WebP, بحد أقصى 5 ميجابايت لكل صورة)
                    </FormDescription>
                    <FormControl>
                      <div className="space-y-4">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleImageSelect}
                          multiple
                          className="hidden"
                          id="branch-image-upload"
                        />
                        
                        {/* معاينة الصور */}
                        {imagePreviews.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                الصور المحددة ({imagePreviews.length}/10)
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleRemoveAllImages}
                                className="gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                حذف الكل
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {imagePreviews.map((preview, index) => (
                                <div
                                  key={index}
                                  className="relative aspect-square rounded-lg overflow-hidden border border-border group"
                                >
                                  <img
                                    src={preview}
                                    alt={`معاينة ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      onClick={() => handleRemoveImage(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  {index === 0 && (
                                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                                      الصورة الرئيسية
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* زر رفع الصور */}
                        {imagePreviews.length < 10 && (
                          <label
                            htmlFor="branch-image-upload"
                            className={cn(
                              "flex flex-col items-center justify-center",
                              "w-full h-32 border-2 border-dashed rounded-lg",
                              "cursor-pointer transition-colors",
                              "hover:border-primary hover:bg-primary/5",
                              "border-border bg-muted/20"
                            )}
                          >
                            <div className="flex flex-col items-center justify-center">
                              <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                              <p className="mb-1 text-sm text-muted-foreground">
                                <span className="font-semibold">انقر لرفع</span> صور الفرع
                              </p>
                              <p className="text-xs text-muted-foreground">
                                يمكنك اختيار صور متعددة (حتى {10 - imagePreviews.length} صورة متبقية)
                              </p>
                            </div>
                          </label>
                        )}
                      </div>
                    </FormControl>
                  </FormItem>
                </div>
              </div>

              {!form.watch('is_24_hours') && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Operating Hours</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="opening_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regular Opening Time *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="closing_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regular Closing Time *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="opening_time_in_friday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Friday Opening Time *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="closing_time_in_friday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Friday Closing Time *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Store Manager</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="store_manager_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Manager name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="store_manager_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+966501234567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="store_manager_email"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="manager@shawarmer.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Area Manager</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="area_manager_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Manager name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="area_manager_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+966501234567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="area_manager_email"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="manager@shawarmer.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">Additional Information</h3>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional notes or special instructions..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isLoading || uploadingImages}>
                  {uploadingImages ? 'جاري رفع الصور...' : isLoading ? 'جاري الحفظ...' : initialData ? 'تحديث الفرع' : 'إنشاء فرع'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}
