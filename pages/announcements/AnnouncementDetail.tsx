import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
import { Loader2, ArrowLeft, Bookmark, Share2, CheckCircle, Eye, Calendar, User, Tag, Edit, Trash2 } from 'lucide-react';
import { getAnnouncementById, updateAnnouncement, deleteAnnouncement } from '@/db/api';
import type { Announcement } from '@/types/types';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { format } from 'date-fns';
import ImageLightbox from '@/components/shift-handover/ImageLightbox';
import { useMousePosition } from '@/components/home/MouseTracker';
import { canWrite } from '@/lib/permissions';

export default function AnnouncementDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const mousePosition = useMousePosition();

  useEffect(() => {
    if (id) {
      loadAnnouncement();
    }
  }, [id]);

  const loadAnnouncement = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await getAnnouncementById(id);
      if (data) {
        setAnnouncement(data);
        
        // Mark as read and increment view count
        if (profile) {
          const readBy = data.read_by || [];
          if (!readBy.includes(profile.id)) {
            await updateAnnouncement(id, {
              read_by: [...readBy, profile.id],
              view_count: (data.view_count || 0) + 1
            });
          }
        }
      } else {
        toast.error('Announcement not found');
        navigate('/announcements');
      }
    } catch (error) {
      console.error('Error loading announcement:', error);
      toast.error('Failed to load announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!announcement || !profile) return;

    try {
      const bookmarkedBy = announcement.is_bookmarked_by || [];
      const isBookmarked = bookmarkedBy.includes(profile.id);
      
      const updatedBookmarks = isBookmarked
        ? bookmarkedBy.filter(userId => userId !== profile.id)
        : [...bookmarkedBy, profile.id];

      await updateAnnouncement(announcement.id, {
        is_bookmarked_by: updatedBookmarks
      });

      setAnnouncement({
        ...announcement,
        is_bookmarked_by: updatedBookmarks
      });

      toast.success(isBookmarked ? 'Bookmark removed' : 'Announcement bookmarked');
    } catch (error) {
      console.error('Error bookmarking announcement:', error);
      toast.error('Failed to bookmark announcement');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      setDeleting(true);
      await deleteAnnouncement(id);
      toast.success('Announcement deleted successfully');
      navigate('/announcements');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const parallaxX = mousePosition.x * 0.015;
  const parallaxY = mousePosition.y * 0.015;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-primary">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
      </div>
    );
  }

  if (!announcement) {
    return null;
  }

  const isBookmarked = announcement.is_bookmarked_by?.includes(profile?.id || '');
  const canEdit = profile ? canWrite(profile.role) : false;
  const allImages = [
    ...(announcement.banner_image_url ? [announcement.banner_image_url] : []),
    ...(announcement.images || [])
  ];

  return (
    <>
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

        {/* Content */}
        <div className="relative z-10">
          {/* Hero Banner */}
          {announcement.banner_image_url && (
            <div className="relative h-[400px] xl:h-[500px] overflow-hidden">
              <img
                src={announcement.banner_image_url}
                alt={announcement.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              
              {/* Title Overlay */}
              <div className="absolute inset-0 flex items-end">
                <div className="container pb-12">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/announcements')}
                    className="mb-6 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Announcements
                  </Button>
                  
                  <Badge className={`
                    mb-4 text-sm px-4 py-1.5
                    ${announcement.category === 'urgent'
                      ? 'bg-red-500'
                      : announcement.category === 'update'
                      ? 'bg-blue-500'
                      : announcement.category === 'policy'
                      ? 'bg-purple-500'
                      : announcement.category === 'team'
                      ? 'bg-green-500'
                      : 'bg-accent'
                    }
                  `}>
                    {announcement.category.toUpperCase()}
                  </Badge>
                  
                  <h1 className="text-4xl xl:text-6xl font-bold text-white mb-4 max-w-4xl">
                    {announcement.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-6 text-white/90">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      <span className="font-medium">{announcement.creator?.full_name || 'Admin'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      <span>{format(new Date(announcement.created_at), 'MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      <span>{announcement.view_count || 0} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-5 h-5" />
                      <span>{announcement.is_bookmarked_by?.length || 0} bookmarks</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="container py-8 xl:py-12">
            {!announcement.banner_image_url && (
              <Button
                variant="outline"
                onClick={() => navigate('/announcements')}
                className="mb-6 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Announcements
              </Button>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Main Content Column */}
              <div className="xl:col-span-2 space-y-6">
                {/* Content Card */}
                <Card className="glassmorphic border-accent/20 shadow-2xl p-8">
                  {!announcement.banner_image_url && (
                    <>
                      <Badge className={`
                        mb-4 text-sm px-4 py-1.5
                        ${announcement.category === 'urgent'
                          ? 'bg-red-500'
                          : announcement.category === 'update'
                          ? 'bg-blue-500'
                          : announcement.category === 'policy'
                          ? 'bg-purple-500'
                          : announcement.category === 'team'
                          ? 'bg-green-500'
                          : 'bg-accent'
                        }
                      `}>
                        {announcement.category.toUpperCase()}
                      </Badge>
                      
                      <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6">
                        {announcement.title}
                      </h1>
                    </>
                  )}

                  <div className="prose prose-invert max-w-none">
                    <p className="text-white/90 text-lg leading-relaxed whitespace-pre-wrap">
                      {announcement.content || announcement.message}
                    </p>
                  </div>
                </Card>

                {/* Image Gallery */}
                {announcement.images && announcement.images.length > 0 && (
                  <Card className="glassmorphic border-accent/20 shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Image Gallery</h2>
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                      {announcement.images.map((imageUrl, index) => (
                        <div
                          key={index}
                          onClick={() => handleImageClick(announcement.banner_image_url ? index + 1 : index)}
                          className="relative group aspect-square rounded-lg overflow-hidden border-2 border-white/20 hover:border-accent transition-all duration-300 cursor-pointer"
                        >
                          <img
                            src={imageUrl}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                              <Eye className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Actions Card */}
                <Card className="glassmorphic border-accent/20 shadow-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Actions</h3>
                  <div className="space-y-3">
                    {canEdit && (
                      <>
                        <Button
                          onClick={() => navigate(`/announcements/edit/${announcement.id}`)}
                          className="w-full justify-start bg-gradient-to-r from-accent to-primary-glow hover:opacity-90 text-primary border-0"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Announcement
                        </Button>
                        <Button
                          onClick={() => setDeleteDialogOpen(true)}
                          className="w-full justify-start bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                          variant="outline"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Announcement
                        </Button>
                      </>
                    )}
                    <Button
                      onClick={handleBookmark}
                      className={`
                        w-full justify-start
                        ${isBookmarked
                          ? 'bg-accent/20 text-accent border-accent hover:bg-accent/30'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                        }
                      `}
                      variant="outline"
                    >
                      <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                      {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                    </Button>
                    <Button
                      onClick={handleShare}
                      className="w-full justify-start bg-white/10 text-white border-white/20 hover:bg-white/20"
                      variant="outline"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Internally
                    </Button>
                    {profile && announcement.read_by?.includes(profile.id) && (
                      <div className="flex items-center gap-2 text-green-400 text-sm p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <CheckCircle className="w-4 h-4" />
                        <span>You've read this</span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Author Info Card */}
                <Card className="glassmorphic border-accent/20 shadow-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Posted By</h3>
                  <div className="flex items-center gap-3 mb-4">
                    {announcement.creator?.profile_image_url ? (
                      <img
                        src={announcement.creator.profile_image_url}
                        alt={announcement.creator.full_name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-accent"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-accent" />
                      </div>
                    )}
                    <div>
                      <p className="text-white font-semibold">{announcement.creator?.full_name || 'Admin'}</p>
                      <p className="text-white/60 text-sm">{announcement.creator?.position || 'Administrator'}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-white/80">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Published {format(new Date(announcement.created_at), 'PPP')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>{announcement.view_count || 0} views</span>
                    </div>
                  </div>
                </Card>

                {/* Tags Card */}
                {announcement.target_audience && (
                  <Card className="glassmorphic border-accent/20 shadow-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      Details
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-white/60 mb-1">Target Audience</p>
                        <Badge variant="secondary" className="text-xs">
                          {announcement.target_audience.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-white/60 mb-1">Priority</p>
                        <Badge 
                          className={`
                            text-xs
                            ${announcement.priority === 'high'
                              ? 'bg-red-500'
                              : announcement.priority === 'low'
                              ? 'bg-blue-500'
                              : 'bg-accent'
                            }
                          `}
                        >
                          {announcement.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={allImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-secondary border-accent/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-2xl">Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription className="text-white/80 text-base">
              Are you sure you want to delete this announcement? This action cannot be undone.
              The announcement will be permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
