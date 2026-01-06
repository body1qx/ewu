import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Filter, Users, Info, AlertTriangle, AlertCircle, X, Edit, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRecentShiftHandoverNotes, isShiftNoteNew } from '@/db/api';
import type { ShiftHandoverNote } from '@/types/types';
import { format } from 'date-fns';
import ShiftHandoverBubble from './ShiftHandoverBubble';
import ShiftHandoverModal from './ShiftHandoverModal';

export default function ShiftHandoverHub() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<ShiftHandoverNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<ShiftHandoverNote | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await getRecentShiftHandoverNotes(20);
      setNotes(data);
    } catch (error) {
      console.error('Error loading shift handover notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = notes.filter(note => {
    if (shiftFilter !== 'all' && note.shift_type !== shiftFilter) return false;
    if (dateFilter === 'today') {
      const today = new Date();
      const noteDate = new Date(note.created_at);
      return noteDate.toDateString() === today.toDateString();
    }
    return true;
  });

  const handleBubbleClick = (note: ShiftHandoverNote) => {
    setSelectedNote(note);
    setDetailsOpen(true);
  };

  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    loadNotes();
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

  return (
    <div className="relative overflow-hidden rounded-3xl border border-accent/20 shadow-2xl">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-primary animate-gradient-shift opacity-95" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-20 right-20 w-40 h-40 bg-primary-glow/10 rounded-full blur-3xl animate-float animation-delay-2000" />
        <div className="absolute bottom-10 left-1/3 w-36 h-36 bg-accent-orange/10 rounded-full blur-3xl animate-float animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 xl:p-12">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-8">
          <div className="space-y-2">
            <h2 className="text-4xl xl:text-5xl font-bold text-white flex items-center gap-3" dir="rtl">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 backdrop-blur-sm flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              {t('shiftHandover.hubTitle')}
            </h2>
            <p className="text-white/80 text-lg" dir="rtl">
              {t('shiftHandover.hubSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px] bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t('global.select')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">{t('shiftHandover.filters.today')}</SelectItem>
                <SelectItem value="all">{t('shiftHandover.filters.allTime')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Shift Filter */}
            <Select value={shiftFilter} onValueChange={setShiftFilter}>
              <SelectTrigger className="w-[140px] bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t('global.select')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('shiftHandover.filters.allShifts')}</SelectItem>
                <SelectItem value="morning">{t('shiftHandover.filters.morning')}</SelectItem>
                <SelectItem value="afternoon">{t('shiftHandover.filters.afternoon')}</SelectItem>
                <SelectItem value="night">{t('shiftHandover.filters.night')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Add Button */}
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-accent hover:bg-accent/90 text-white shadow-glow"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('shiftHandover.addHandover')}
            </Button>

            {/* View All Button */}
            <Button
              variant="outline"
              onClick={() => navigate('/shift-handover')}
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              {t('shiftHandover.viewAll')}
            </Button>
          </div>
        </div>

        {/* Bubbles Container */}
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-accent" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
              <Info className="w-10 h-10 text-white/60" />
            </div>
            <p className="text-white/80 text-lg" dir="rtl">{t('shiftHandover.noHandoversFound')}</p>
            <p className="text-white/60 text-sm mt-2" dir="rtl">{t('shiftHandover.createFirstNote')}</p>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30"
            style={{ scrollBehavior: 'smooth' }}
          >
            {filteredNotes.map((note, index) => (
              <ShiftHandoverBubble
                key={note.id}
                note={note}
                onClick={() => handleBubbleClick(note)}
                isNew={isShiftNoteNew(note.created_at)}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedNote && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-2xl mb-2" dir="rtl">{selectedNote.title}</DialogTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`bg-gradient-to-r ${getPriorityColor(selectedNote.priority)} text-white`}>
                        {t(`shiftHandover.priority.${selectedNote.priority}`).toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {t(`shiftHandover.filters.${selectedNote.shift_type}`)}
                      </Badge>
                      {isShiftNoteNew(selectedNote.created_at) && (
                        <Badge className="bg-green-500 text-white">{t('shiftHandover.new')}</Badge>
                      )}
                      {selectedNote.follow_up_required && (
                        <Badge variant="destructive">{t('shiftHandover.followUpRequired')}</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDetailsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Content */}
                <div>
                  <h3 className="font-semibold mb-2 text-sm text-muted-foreground" dir="rtl">{t('shiftHandover.details')}</h3>
                  <p className="text-base leading-relaxed whitespace-pre-wrap" dir="rtl">{selectedNote.content}</p>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1" dir="rtl">{t('shiftHandover.createdBy')}</p>
                    <p className="font-medium" dir="rtl">{selectedNote.creator?.full_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1" dir="rtl">{t('shiftHandover.dateTime')}</p>
                    <p className="font-medium">{format(new Date(selectedNote.created_at), 'PPp')}</p>
                  </div>
                  {selectedNote.tags && selectedNote.tags.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-2" dir="rtl">{t('shiftHandover.tags')}</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedNote.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setDetailsOpen(false);
                      navigate('/shift-handover');
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {t('shiftHandover.edit')}
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setDetailsOpen(false)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('shiftHandover.markAsRead')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      <ShiftHandoverModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
