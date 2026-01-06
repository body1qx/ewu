import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { startBreak, endBreak, forceEndBreak, getMyBreaksToday } from '@/db/api';
import { Clock, Coffee, Pause, Play, AlertTriangle } from 'lucide-react';
import type { BreakType, MyBreaksToday } from '@/types/types';

export function BreakControlPanel() {
  const [breaksData, setBreaksData] = useState<MyBreaksToday | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [justificationDialogOpen, setJustificationDialogOpen] = useState(false);
  const [selectedBreakType, setSelectedBreakType] = useState<BreakType>('normal');
  const [notes, setNotes] = useState('');
  const [justification, setJustification] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  const fetchBreaksData = async () => {
    try {
      const data = await getMyBreaksToday();
      setBreaksData(data);
    } catch (error) {
      console.error('Error fetching breaks data:', error);
    }
  };

  useEffect(() => {
    fetchBreaksData();
    const interval = setInterval(fetchBreaksData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Update elapsed time for active break
  useEffect(() => {
    if (breaksData?.active_break) {
      const startTime = new Date(breaksData.active_break.start_time).getTime();
      const updateElapsed = () => {
        const now = new Date().getTime();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsed);
      };

      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    }
  }, [breaksData?.active_break]);

  const handleStartBreak = async () => {
    if (!selectedBreakType) {
      toast.error('Please select a break type');
      return;
    }

    setLoading(true);
    try {
      const result = await startBreak(selectedBreakType, notes || undefined);

      if (result.success) {
        toast.success('Break started successfully');
        setStartDialogOpen(false);
        setNotes('');
        await fetchBreaksData();
      } else {
        toast.error(result.error || 'Failed to start break');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start break');
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (!breaksData?.active_break) return;

    setLoading(true);
    try {
      const result = await endBreak(breaksData.active_break.id);

      if (result.success) {
        toast.success(`Break ended. Duration: ${Math.round(result.duration)} minutes`);
        setEndDialogOpen(false);
        await fetchBreaksData();
      } else if (result.requires_justification) {
        setEndDialogOpen(false);
        setJustificationDialogOpen(true);
      } else {
        toast.error(result.error || 'Failed to end break');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to end break');
    } finally {
      setLoading(false);
    }
  };

  const handleForceEndBreak = async () => {
    if (!breaksData?.active_break || !justification.trim()) {
      toast.error('Please provide a justification');
      return;
    }

    setLoading(true);
    try {
      await forceEndBreak(breaksData.active_break.id, justification);
      toast.success('Break ended with justification');
      setJustificationDialogOpen(false);
      setJustification('');
      await fetchBreaksData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to end break');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreakTypeLabel = (type: BreakType) => {
    const labels: Record<BreakType, string> = {
      normal: 'Normal Break',
      prayer: 'Prayer Break',
      technical: 'Technical Issue',
      meeting: 'Meeting',
      auto_idle: 'Auto Idle',
    };
    return labels[type];
  };

  const isWarningLevel = (used: number) => used >= 50 && used < 60;
  const isDangerLevel = (used: number) => used >= 60;

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coffee className="h-5 w-5 text-primary" />
          Break Control
        </CardTitle>
        <CardDescription>Manage your breaks and track your time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {breaksData?.active_break ? (
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 rounded-lg border ${
              elapsedTime >= 1800 // 30 minutes = 1800 seconds
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-primary/10 border-primary/20'
            }`}>
              <div className="space-y-1">
                <p className={`text-sm font-medium ${elapsedTime >= 1800 ? 'text-red-500' : 'text-primary'}`}>
                  بريك نشط
                </p>
                <p className="text-xs text-muted-foreground">
                  {getBreakTypeLabel(breaksData.active_break.break_type)}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${elapsedTime >= 1800 ? 'text-red-500' : 'text-primary'}`}>
                  {formatTime(elapsedTime)}
                </div>
                <p className="text-xs text-muted-foreground">الوقت المنقضي</p>
              </div>
            </div>

            {/* تحذير عند تجاوز 30 دقيقة */}
            {elapsedTime >= 1800 && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg" dir="rtl">
                <p className="text-sm text-red-500 font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  تحذير: تجاوزت البريك 30 دقيقة!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  الحد الأقصى للبريك الواحد هو 30 دقيقة. يرجى إنهاء البريك الآن.
                </p>
              </div>
            )}

            <Button
              onClick={() => setEndDialogOpen(true)}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              <Pause className="mr-2 h-4 w-4" />
              إنهاء البريك
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setStartDialogOpen(true)}
            variant="default"
            className="w-full"
            size="lg"
          >
            <Play className="mr-2 h-4 w-4" />
            Start Break
          </Button>
        )}

        <div className="pt-4 border-t border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Normal Breaks Used</span>
            <span className={`text-sm font-semibold ${
              isDangerLevel(breaksData?.normal_total_minutes || 0) ? 'text-destructive' :
              isWarningLevel(breaksData?.normal_total_minutes || 0) ? 'text-amber-500' :
              'text-foreground'
            }`}>
              {breaksData?.normal_total_minutes || 0} / 60 min
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Meeting Time</span>
            <span className="text-sm font-semibold text-foreground">
              {breaksData?.meeting_total_minutes || 0} min
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Remaining</span>
            <span className="text-sm font-semibold text-primary">
              {breaksData?.remaining_minutes || 60} min
            </span>
          </div>
        </div>

        {isDangerLevel(breaksData?.normal_total_minutes || 0) && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-xs text-destructive font-medium">
              ⚠️ You have exceeded your daily break limit. Further breaks may require supervisor approval.
            </p>
          </div>
        )}

        {isWarningLevel(breaksData?.normal_total_minutes || 0) && !isDangerLevel(breaksData?.normal_total_minutes || 0) && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ You are close to your daily break limit ({breaksData?.normal_total_minutes}/60 min).
            </p>
          </div>
        )}
      </CardContent>

      {/* Start Break Dialog */}
      <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Break</DialogTitle>
            <DialogDescription>Select the type of break you want to take</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="break-type">Break Type</Label>
              <Select value={selectedBreakType} onValueChange={(value) => setSelectedBreakType(value as BreakType)}>
                <SelectTrigger id="break-type">
                  <SelectValue placeholder="Select break type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal Break</SelectItem>
                  <SelectItem value="prayer">Prayer Break</SelectItem>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this break..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStartDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartBreak} disabled={loading}>
              {loading ? 'Starting...' : 'Start Break'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Break Dialog */}
      <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Break</DialogTitle>
            <DialogDescription>
              Are you sure you want to end your current break?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Break Duration</p>
                <p className="text-xs text-muted-foreground">
                  {getBreakTypeLabel(breaksData?.active_break?.break_type || 'normal')}
                </p>
              </div>
              <div className="text-2xl font-bold text-primary">{formatTime(elapsedTime)}</div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEndDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEndBreak} disabled={loading}>
              {loading ? 'Ending...' : 'End Break'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Justification Dialog */}
      <Dialog open={justificationDialogOpen} onOpenChange={setJustificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Break Exceeds 30 Minutes</DialogTitle>
            <DialogDescription>
              Your break has exceeded the 30-minute limit. Please provide a justification to continue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="justification">Justification *</Label>
              <Textarea
                id="justification"
                placeholder="Explain why this break exceeded 30 minutes..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setJustificationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleForceEndBreak} disabled={loading || !justification.trim()}>
              {loading ? 'Submitting...' : 'Submit & End Break'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
