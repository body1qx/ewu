import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createAnnouncement, uploadAnnouncementImage, getAnnouncementById, updateAnnouncement } from '@/db/api';
import { Loader2, FileText, Users, Image as ImageIcon, Send, Save, Calendar, Info, AlertTriangle, TrendingUp, FileText as FileTextIcon, Users as UsersIcon, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AnnouncementImageUpload from '@/components/announcements/AnnouncementImageUpload';
import { useMousePosition } from '@/components/home/MouseTracker';

export default function AnnouncementForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const mousePosition = useMousePosition();

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    content: '',
    category: 'info',
    target_audience: 'all',
    target_roles: [] as string[],
    target_teams: [] as string[],
    banner_image_url: '',
    images: [] as string[],
    attachments: [] as string[],
    priority: 'normal',
    publish_option: 'now'
  });

  const categories = [
    { id: 'info', label: 'Info', icon: Info, color: 'from-blue-500 to-blue-600' },
    { id: 'urgent', label: 'Urgent', icon: AlertTriangle, color: 'from-red-500 to-red-600' },
    { id: 'update', label: 'Update', icon: TrendingUp, color: 'from-green-500 to-green-600' },
    { id: 'policy', label: 'Policy', icon: FileTextIcon, color: 'from-purple-500 to-purple-600' },
    { id: 'team', label: 'Team', icon: UsersIcon, color: 'from-accent to-primary-glow' },
  ];

  // Load announcement data in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadAnnouncementData();
    }
  }, [id, isEditMode]);

  const loadAnnouncementData = async () => {
    if (!id) return;
    
    try {
      setInitialLoading(true);
      const announcement = await getAnnouncementById(id);
      
      if (announcement) {
        setFormData({
          title: announcement.title || '',
          message: announcement.message || '',
          content: announcement.content || '',
          category: announcement.category || 'info',
          target_audience: announcement.target_audience || 'all',
          target_roles: announcement.target_roles || [],
          target_teams: announcement.target_teams || [],
          banner_image_url: announcement.banner_image_url || '',
          images: announcement.images || [],
          attachments: announcement.attachments || [],
          priority: announcement.priority || 'normal',
          publish_option: 'now'
        });
      } else {
        toast.error('Announcement not found');
        navigate('/announcements');
      }
    } catch (error) {
      console.error('Error loading announcement:', error);
      toast.error('Failed to load announcement');
      navigate('/announcements');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleBannerUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const url = await uploadAnnouncementImage(file);
      setFormData({ ...formData, banner_image_url: url });
      toast.success('Banner image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading banner:', error);
      toast.error(error.message || 'Failed to upload banner image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImagesUpload = async (files: File[]) => {
    setUploadingImage(true);
    try {
      const uploadPromises = files.map(file => uploadAnnouncementImage(file));
      const urls = await Promise.all(uploadPromises);
      setFormData({ ...formData, images: [...formData.images, ...urls] });
      toast.success(`${files.length} image(s) uploaded successfully`);
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast.error(error.message || 'Failed to upload images');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageRemove = (imageUrl: string, isBanner: boolean = false) => {
    if (isBanner) {
      setFormData({ ...formData, banner_image_url: '' });
    } else {
      setFormData({ ...formData, images: formData.images.filter(url => url !== imageUrl) });
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!formData.title || !formData.message) {
      toast.error('Please fill in title and message');
      return;
    }

    try {
      setLoading(true);

      const announcementData = {
        title: formData.title,
        message: formData.message,
        content: formData.content || formData.message,
        category: formData.category,
        target_audience: formData.target_audience,
        target_roles: formData.target_roles,
        target_teams: formData.target_teams,
        banner_image_url: formData.banner_image_url || null,
        images: formData.images,
        attachments: formData.attachments,
        priority: formData.priority as 'normal' | 'high' | 'low',
        status: isDraft ? 'draft' as const : 'published' as const,
        is_published: !isDraft,
        scheduled_date: formData.publish_option === 'schedule' ? new Date().toISOString() : null
      };

      if (isEditMode && id) {
        // Update existing announcement
        await updateAnnouncement(id, announcementData);
      } else {
        // Create new announcement
        await createAnnouncement(announcementData);
      }

      // Show success animation
      setShowSuccess(true);
      
      setTimeout(() => {
        toast.success(
          isEditMode 
            ? 'Announcement updated successfully' 
            : isDraft 
              ? 'Draft saved successfully' 
              : 'Announcement published successfully'
        );
        navigate('/announcements');
      }, 1500);
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} announcement:`, error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} announcement`);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !formData.title) {
      toast.error('Please enter a title');
      return;
    }
    if (currentStep === 2 && !formData.message) {
      toast.error('Please enter a message');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const parallaxX = mousePosition.x * 0.015;
  const parallaxY = mousePosition.y * 0.015;

  // Show loading state while fetching announcement data in edit mode
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-primary">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-primary via-secondary to-primary animate-gradient-shift opacity-95"
        style={{
          transform: `translate(${parallaxX}px, ${parallaxY}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      />
      
      {/* Floating particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-40 w-80 h-80 bg-primary-glow/10 rounded-full blur-3xl animate-float animation-delay-2000" />
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-accent-orange/10 rounded-full blur-3xl animate-float animation-delay-4000" />
      </div>

      {/* Success Animation Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center animate-fade-in">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-accent to-primary-glow flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
              <CheckCircle2 className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">Success!</h2>
            <p className="text-white/80 text-xl">
              {isEditMode ? 'Announcement updated successfully' : 'Announcement created successfully'}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 container py-8 xl:py-12 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate('/announcements')}
          className="mb-6 bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Announcements
        </Button>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-3">
            {isEditMode ? 'Edit Announcement' : 'Create New Announcement'}
          </h1>
          <p className="text-white/80 text-lg">
            {isEditMode ? 'Update your announcement details' : 'Share important updates with your team'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-center gap-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300
                  ${currentStep >= step
                    ? 'bg-gradient-to-r from-accent to-primary-glow text-primary shadow-glow scale-110'
                    : 'bg-white/10 text-white/40'
                  }
                `}
              >
                {step}
              </div>
              {step < 4 && (
                <div
                  className={`
                    w-16 h-1 mx-2 transition-all duration-300
                    ${currentStep > step ? 'bg-accent' : 'bg-white/20'}
                  `}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className="glassmorphic border-accent/20 shadow-2xl">
          <CardHeader className="border-b border-accent/20 bg-gradient-to-r from-accent/10 to-primary-glow/10">
            <CardTitle className="text-2xl text-white">
              {currentStep === 1 && 'Step 1: Basic Information'}
              {currentStep === 2 && 'Step 2: Content'}
              {currentStep === 3 && 'Step 3: Media Upload'}
              {currentStep === 4 && 'Step 4: Publish Options'}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white font-semibold text-lg">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter announcement title..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-lg h-14"
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-3">
                  <Label className="text-white font-semibold text-lg">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      const isActive = formData.category === category.id;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: category.id })}
                          className={`
                            p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2
                            ${isActive
                              ? 'border-accent bg-accent/20 text-accent shadow-glow scale-105'
                              : 'border-white/20 bg-white/5 text-white/80 hover:border-accent/50 hover:bg-accent/10'
                            }
                          `}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-sm font-medium">{category.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Audience */}
                <div className="space-y-2">
                  <Label htmlFor="target_audience" className="text-white font-semibold text-lg">
                    Target Audience
                  </Label>
                  <Select value={formData.target_audience} onValueChange={(value) => setFormData({ ...formData, target_audience: value })}>
                    <SelectTrigger id="target_audience" className="bg-white/10 border-white/20 text-white h-12">
                      <SelectValue placeholder="Select target audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Staff</SelectItem>
                      <SelectItem value="specific_team">Specific Team</SelectItem>
                      <SelectItem value="role_based">Role Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label className="text-white font-semibold text-lg">Priority Level</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['normal', 'high', 'low'] as const).map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority })}
                        className={`
                          p-3 rounded-lg border-2 transition-all duration-300 text-sm font-medium
                          ${formData.priority === priority
                            ? priority === 'high'
                              ? 'border-red-500 bg-red-500/20 text-red-300'
                              : priority === 'low'
                              ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                              : 'border-accent bg-accent/20 text-accent'
                            : 'border-white/20 bg-white/5 text-white/60 hover:border-white/40'
                          }
                        `}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Content */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                {/* Message (Short Preview) */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white font-semibold text-lg">
                    Short Message <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Brief summary that appears in the announcement card..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[100px]"
                    required
                  />
                  <p className="text-white/60 text-sm">This will appear as the preview text</p>
                </div>

                {/* Full Content */}
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-white font-semibold text-lg">
                    Full Content
                  </Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write the full announcement content here. You can use formatting, add links, bullet points, etc..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[300px]"
                  />
                  <p className="text-white/60 text-sm">Full details that appear on the announcement page</p>
                </div>
              </div>
            )}

            {/* Step 3: Media Upload */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <AnnouncementImageUpload
                  bannerImageUrl={formData.banner_image_url}
                  images={formData.images}
                  onBannerUpload={handleBannerUpload}
                  onImagesUpload={handleImagesUpload}
                  onImageRemove={handleImageRemove}
                  uploading={uploadingImage}
                />
              </div>
            )}

            {/* Step 4: Publish Options */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-3">
                  <Label className="text-white font-semibold text-lg">When to Publish?</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, publish_option: 'now' })}
                      className={`
                        p-6 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3
                        ${formData.publish_option === 'now'
                          ? 'border-accent bg-accent/20 text-accent shadow-glow'
                          : 'border-white/20 bg-white/5 text-white/80 hover:border-accent/50'
                        }
                      `}
                    >
                      <Send className="w-8 h-8" />
                      <span className="font-semibold">Publish Now</span>
                      <span className="text-sm opacity-80">Make it live immediately</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, publish_option: 'schedule' })}
                      className={`
                        p-6 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3
                        ${formData.publish_option === 'schedule'
                          ? 'border-accent bg-accent/20 text-accent shadow-glow'
                          : 'border-white/20 bg-white/5 text-white/80 hover:border-accent/50'
                        }
                      `}
                    >
                      <Calendar className="w-8 h-8" />
                      <span className="font-semibold">Schedule</span>
                      <span className="text-sm opacity-80">Set a future date</span>
                    </button>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-6 bg-white/5 rounded-xl border border-white/20">
                  <h3 className="text-white font-semibold text-lg mb-4">Announcement Summary</h3>
                  <div className="space-y-2 text-white/80">
                    <p><span className="font-medium">Title:</span> {formData.title || 'Not set'}</p>
                    <p><span className="font-medium">Category:</span> {formData.category}</p>
                    <p><span className="font-medium">Priority:</span> {formData.priority}</p>
                    <p><span className="font-medium">Target:</span> {formData.target_audience}</p>
                    <p><span className="font-medium">Images:</span> {formData.images.length + (formData.banner_image_url ? 1 : 0)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-6 border-t border-white/10">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Previous
                </Button>
              )}
              
              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 bg-gradient-to-r from-accent to-primary-glow hover:opacity-90 text-primary shadow-glow"
                >
                  Next Step
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSubmit(true)}
                    disabled={loading}
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save as Draft
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-accent to-primary-glow hover:opacity-90 text-primary shadow-glow"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    {isEditMode ? 'Update Announcement' : 'Publish Announcement'}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
