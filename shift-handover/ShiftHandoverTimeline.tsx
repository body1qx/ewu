import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, Sun, Moon, CloudMoon, Image as ImageIcon, Pin, CheckCircle, Edit, Trash2, ExternalLink, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import type { ShiftHandoverNote } from '@/types/types';
import { format } from 'date-fns';
import { isShiftNoteNew, updateShiftHandoverNote, deleteShiftHandoverNote } from '@/db/api';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import ImageLightbox from './ImageLightbox';
import { canWrite } from '@/lib/permissions';
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

interface ShiftHandoverTimelineProps {
  notes: ShiftHandoverNote[];
  loading: boolean;
  onNoteUpdated: () => void;
  onNoteDeleted: () => void;
}

export default function ShiftHandoverTimeline({ notes, loading, onNoteUpdated, onNoteDeleted }: ShiftHandoverTimelineProps) {
  const { profile } = useAuth();
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const shiftIcons = {
    morning: Sun,
    afternoon: Sun,
    night: Moon,
    general: CloudMoon
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return AlertCircle;
      case 'high':
        return AlertTriangle;
      default:
        return Info;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'from-red-500 to-red-600';
      case 'high':
        return 'from-accent-orange to-accent';
      default:
        return 'from-accent to-primary-glow';
    }
  };

  const handleToggleExpand = (noteId: string) => {
    setExpandedNoteId(expandedNoteId === noteId ? null : noteId);
  };

  const handleImageClick = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handlePin = async (note: ShiftHandoverNote) => {
    try {
      await updateShiftHandoverNote(note.id, { is_pinned: !note.is_pinned });
      toast.success(note.is_pinned ? 'تم إلغاء التثبيت! (طار من فوق! 📌)' : 'تم التثبيت! (ثابت فوق! 📌✨)');
      onNoteUpdated();
    } catch (error) {
      console.error('Error pinning note:', error);
      toast.error('في مشكلة في التثبيت! جرّب مرة ثانية 😬');
    }
  };

  const handleResolve = async (note: ShiftHandoverNote) => {
    try {
      await updateShiftHandoverNote(note.id, { is_resolved: !note.is_resolved });
      toast.success(note.is_resolved ? 'تم إلغاء الحل! (رجعت المشكلة! 🔄)' : 'تم الحل! (مشكلة أقل! ✅🎉)');
      onNoteUpdated();
    } catch (error) {
      console.error('Error resolving note:', error);
      toast.error('في مشكلة في تحديث الحالة! جرّب مرة ثانية 😬');
    }
  };

  const handleDeleteClick = (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;

    try {
      await deleteShiftHandoverNote(noteToDelete);
      toast.success('تم الحذف بنجاح! (راحت الملاحظة! 🗑️✨)');
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
      onNoteDeleted();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('في مشكلة في الحذف! جرّب مرة ثانية 😬');
    }
  };

  // Sort notes: pinned first, then by date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const isAdmin = profile?.role === 'admin';
  const userCanWrite = profile ? canWrite(profile.role) : false;

  return (
    <>
      <Card className="glassmorphic border-accent/20 shadow-2xl">
        <CardHeader className="border-b border-accent/20 bg-gradient-to-r from-accent/10 to-primary-glow/10">
          <CardTitle className="text-2xl text-white flex items-center gap-3" dir="rtl">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            خط زمن التسليم ⏰
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
            </div>
          ) : sortedNotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-white/60" />
              </div>
              <p className="text-white/80 text-lg" dir="rtl">ما فيه ملاحظات للحين! 📝</p>
              <p className="text-white/60 text-sm mt-2" dir="rtl">ابدأ بإضافة أول ملاحظة تسليم (يلا! 🚀)</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedNotes.map((note, index) => {
                const ShiftIcon = shiftIcons[note.shift_type];
                const PriorityIcon = getPriorityIcon(note.priority);
                const isExpanded = expandedNoteId === note.id;
                const isNew = isShiftNoteNew(note.created_at);

                return (
                  <div
                    key={note.id}
                    className={`
                      relative group
                      animate-fade-in-up
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Timeline connector */}
                    {index < sortedNotes.length - 1 && (
                      <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-gradient-to-b from-accent/50 to-transparent" />
                    )}

                    <div
                      className={`
                        relative rounded-xl border-2 transition-all duration-300 cursor-pointer
                        ${isExpanded
                          ? 'border-accent bg-white/10 shadow-glow'
                          : 'border-white/20 bg-white/5 hover:border-accent/50 hover:bg-white/10 hover:shadow-elegant'
                        }
                        ${note.is_resolved ? 'opacity-60' : ''}
                      `}
                      onClick={() => handleToggleExpand(note.id)}
                    >
                      {/* Pinned indicator */}
                      {note.is_pinned && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-glow z-10">
                          <Pin className="w-4 h-4 text-primary" />
                        </div>
                      )}

                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-start gap-4">
                          {/* Shift Icon */}
                          <div className={`
                            w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0
                            bg-gradient-to-br ${getPriorityColor(note.priority)}
                            shadow-lg
                          `}>
                            <ShiftIcon className="w-8 h-8 text-white" />
                          </div>

                          {/* Content Preview */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-white line-clamp-2">
                                {note.title}
                              </h3>
                              {isNew && (
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <Badge className="bg-green-500 text-white animate-pulse">جديد!</Badge>
                                  <span className="text-xs text-green-400 font-bold animate-bounce">
                                    يلا! وش تنتظر؟ 🚀
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge className={`bg-gradient-to-r ${getPriorityColor(note.priority)} text-white`}>
                                {note.priority === 'urgent' && '🚨 عاجل جداً!'}
                                {note.priority === 'high' && '⚠️ مهم!'}
                                {note.priority === 'normal' && 'عادي'}
                              </Badge>
                              <Badge variant="outline" className="text-white border-white/30">
                                {note.shift_type === 'morning' && '☀️ صباحي'}
                                {note.shift_type === 'afternoon' && '🌤️ مسائي'}
                                {note.shift_type === 'night' && '🌙 ليلي'}
                                {note.shift_type === 'general' && '🌍 عام'}
                              </Badge>
                              {note.team && (
                                <Badge variant="outline" className="text-white border-white/30">
                                  {note.team.toUpperCase()}
                                </Badge>
                              )}
                              {note.follow_up_required && (
                                <Badge variant="destructive" className="animate-pulse">
                                  يحتاج متابعة! 📌
                                </Badge>
                              )}
                              {note.is_resolved && (
                                <Badge className="bg-green-600 text-white">
                                  تم الحل ✅
                                </Badge>
                              )}
                            </div>

                            {!isExpanded && (
                              <p className="text-white/70 text-sm line-clamp-2 mb-2">
                                {note.content}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-white/60">
                              <span>{note.creator?.full_name || 'Unknown'}</span>
                              <span>•</span>
                              <span>{format(new Date(note.created_at), 'PPp')}</span>
                              {note.images && note.images.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3" />
                                    {note.images.length} image{note.images.length > 1 ? 's' : ''}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-white/10 space-y-4" onClick={(e) => e.stopPropagation()}>
                            {/* Full Content */}
                            <div>
                              <h4 className="text-sm font-semibold text-white/80 mb-2">Details</h4>
                              <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
                                {note.content}
                              </p>
                            </div>

                            {/* Images */}
                            {note.images && note.images.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-white/80 mb-2">Images</h4>
                                <div className="grid grid-cols-3 gap-3">
                                  {note.images.map((imageUrl, imgIndex) => (
                                    <div
                                      key={imgIndex}
                                      className="relative group/img aspect-square rounded-lg overflow-hidden border-2 border-white/20 hover:border-accent transition-all duration-300 cursor-pointer"
                                      onClick={() => handleImageClick(note.images, imgIndex)}
                                    >
                                      <img
                                        src={imageUrl}
                                        alt={`Image ${imgIndex + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-110"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                          <ImageIcon className="w-5 h-5 text-white" />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg">
                              {note.time_range_start && note.time_range_end && (
                                <div>
                                  <p className="text-xs text-white/60 mb-1">Time Range</p>
                                  <p className="text-sm text-white">
                                    {note.time_range_start} - {note.time_range_end}
                                  </p>
                                </div>
                              )}
                              {note.related_ticket_link && (
                                <div>
                                  <p className="text-xs text-white/60 mb-1">Related Ticket</p>
                                  <a
                                    href={note.related_ticket_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-accent hover:underline flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    View Ticket
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              )}
                              {note.tags && note.tags.length > 0 && (
                                <div className="col-span-2">
                                  <p className="text-xs text-white/60 mb-2">Tags</p>
                                  <div className="flex flex-wrap gap-2">
                                    {note.tags.map((tag, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            {userCanWrite && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePin(note)}
                                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                >
                                  <Pin className="w-4 h-4 mr-2" />
                                  {note.is_pinned ? 'Unpin' : 'Pin to Top'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResolve(note)}
                                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {note.is_resolved ? 'Mark Unresolved' : 'Mark Resolved'}
                                </Button>
                                {isAdmin && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteClick(note.id)}
                                    className="ml-auto"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Handover Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this handover note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
