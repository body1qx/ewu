import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay } from 'date-fns';
import { CalendarDays, Clock, CheckCircle2, XCircle, AlertCircle, Users, Ban, AlertTriangle } from 'lucide-react';
import {
  getOrCreateLeaveBalance,
  getUserLeaveRequests,
  submitLeaveRequest,
  checkLeaveConflict,
  getLeaveDaysWithUsers,
  requestLeaveCancellation,
  getMyCancellationRequests,
} from '@/db/api';
import type { EmployeeLeaveBalance, LeaveRequestWithDetails, LeaveDay, Profile, LeaveCancellationRequestWithDetails } from '@/types/types';

export default function AnnualLeave() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  const [balance, setBalance] = useState<EmployeeLeaveBalance | null>(null);
  const [requests, setRequests] = useState<LeaveRequestWithDetails[]>([]);
  const [cancellationRequests, setCancellationRequests] = useState<LeaveCancellationRequestWithDetails[]>([]);
  const [teamLeaves, setTeamLeaves] = useState<Array<LeaveDay & { user?: Profile }>>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showCancelRequestDialog, setShowCancelRequestDialog] = useState(false);
  const [selectedLeaveForCancellation, setSelectedLeaveForCancellation] = useState<LeaveRequestWithDetails | null>(null);
  const [cancellationRequestReason, setCancellationRequestReason] = useState('');
  const [reason, setReason] = useState('');
  const [leaveType, setLeaveType] = useState<'normal' | 'emergency'>('normal');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [balanceData, requestsData, teamLeavesData, cancellationRequestsData] = await Promise.all([
        getOrCreateLeaveBalance(user.id, currentYear),
        getUserLeaveRequests(user.id),
        getLeaveDaysWithUsers(
          format(startOfYear(new Date()), 'yyyy-MM-dd'),
          format(endOfYear(new Date()), 'yyyy-MM-dd'),
          'approved'
        ),
        getMyCancellationRequests(),
      ]);

      setBalance(balanceData);
      setRequests(requestsData);
      setTeamLeaves(teamLeavesData);
      setCancellationRequests(cancellationRequestsData);
    } catch (error) {
      console.error('خطأ في تحميل بيانات الإجازات:', error);
      toast({
        title: 'في مشكلة! 😅',
        description: 'ما قدرنا نحمّل بيانات الإجازات. جرّب مرة ثانية يا بطل!',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    console.log('handleSubmitRequest called');
    console.log('User ID:', user?.id);
    console.log('Selected dates:', selectedDates);
    console.log('Leave type:', leaveType);
    console.log('Balance:', balance);

    if (!user?.id) {
      toast({
        title: 'لحظة! 🤔',
        description: 'ما أنت مسجّل دخول! ارجع سجّل دخولك أول يا شاطر 😅',
        variant: 'destructive',
      });
      return;
    }

    if (selectedDates.length === 0) {
      toast({
        title: 'ما اخترت أيام! 📅',
        description: 'اختر على الأقل يوم واحد عشان نقدّم طلب الإجازة 😊',
        variant: 'destructive',
      });
      return;
    }

    const availableDays = leaveType === 'emergency' 
      ? (balance?.emergency_remaining_days || 0)
      : (balance?.remaining_days || 0);

    console.log('الأيام المتاحة:', availableDays);

    if (!balance || availableDays < selectedDates.length) {
      toast({
        title: 'رصيدك ما يكفي! 😬',
        description: `عندك بس ${availableDays} يوم ${leaveType === 'emergency' ? 'طوارئ' : 'عادي'} متبقي. خفّف شوي يا بطل! 😅`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const dateStrings = selectedDates.map(d => format(d, 'yyyy-MM-dd')).sort();
      console.log('Date strings:', dateStrings);

      console.log('Checking for conflicts...');
      const conflicts = await checkLeaveConflict(dateStrings);
      console.log('Conflicts:', conflicts);

      if (conflicts.length > 0) {
        const conflictMsg = conflicts
          .map(c => `${format(new Date(c.conflict_date), 'MMM dd, yyyy')} - ${c.conflict_user_name}`)
          .join('\n');

        toast({
          title: 'في تعارض! 😬',
          description: `الأيام هذي محجوزة من زملائك:\n${conflictMsg}\nاختر أيام ثانية يا شاطر! 📅`,
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      console.log('جاري إرسال طلب الإجازة...');
      const result = await submitLeaveRequest(user.id, dateStrings, reason || undefined, leaveType);
      console.log('نتيجة الإرسال:', result);

      if (result.success) {
        toast({
          title: 'تمام يا بطل! 🎉',
          description: `تم إرسال طلب إجازتك ${leaveType === 'emergency' ? 'الطارئة 🚨' : 'العادية 😎'} للموافقة. استنى الرد من الأدمن! ⏳`,
        });

        setSelectedDates([]);
        setReason('');
        setLeaveType('normal');
        setShowSubmitDialog(false);
        await loadData();
      } else {
        toast({
          title: 'في مشكلة! 😅',
          description: result.error || result.message || 'ما قدرنا نرسل طلب الإجازة. جرّب مرة ثانية!',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('خطأ في إرسال طلب الإجازة:', error);
      const errorMessage = error instanceof Error ? error.message : 'صار خطأ غير متوقع! 🤔';
      toast({
        title: 'خطأ! 😬',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestCancellation = async () => {
    console.log('handleRequestCancellation called');
    console.log('Selected leave:', selectedLeaveForCancellation);
    console.log('Reason:', cancellationRequestReason);

    if (!selectedLeaveForCancellation) {
      toast({
        title: 'خطأ! 🤔',
        description: 'ما اخترت إجازة للإلغاء! اختر إجازة أول يا شاطر 😅',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('جاري طلب الإلغاء...');
      const result = await requestLeaveCancellation(
        selectedLeaveForCancellation.id,
        cancellationRequestReason.trim() || undefined
      );
      console.log('نتيجة الإلغاء:', result);

      if (result.success) {
        toast({
          title: 'تم إرسال الطلب! 📨',
          description: 'تم إرسال طلب الإلغاء للأدمن. استنى الموافقة يا بطل! ⏳',
        });

        setShowCancelRequestDialog(false);
        setSelectedLeaveForCancellation(null);
        setCancellationRequestReason('');
        await loadData();
      } else {
        toast({
          title: 'في مشكلة! 😅',
          description: result.error || 'ما قدرنا نرسل طلب الإلغاء. جرّب مرة ثانية!',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('خطأ في طلب الإلغاء:', error);
      const errorMessage = error instanceof Error ? error.message : 'صار خطأ غير متوقع! 🤔';
      toast({
        title: 'خطأ! 😬',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasPendingCancellationRequest = (leaveRequestId: string) => {
    return cancellationRequests.some(
      cr => cr.leave_request_id === leaveRequestId && cr.status === 'pending'
    );
  };

  const getCancellationRequestStatus = (leaveRequestId: string) => {
    return cancellationRequests.find(cr => cr.leave_request_id === leaveRequestId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600 hover:bg-green-700" dir="rtl">موافق عليها ✅</Badge>;
      case 'rejected':
        return <Badge className="bg-red-600 hover:bg-red-700" dir="rtl">مرفوضة ❌</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600 hover:bg-yellow-700" dir="rtl">تحت المراجعة ⏳</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-600 hover:bg-gray-700" dir="rtl">ملغية 🚫</Badge>;
      default:
        return <Badge dir="rtl">{status}</Badge>;
    }
  };

  const isDateDisabled = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return teamLeaves.some(leave => leave.leave_date === dateStr && leave.user_id !== user?.id);
  };

  const isDateSelected = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return selectedDates.some(d => format(d, 'yyyy-MM-dd') === dateStr);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground" dir="rtl">جاري تحميل بيانات الإجازات... ⏳</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" dir="rtl">تخطيط الإجازات السنوية 🏖️</h1>
          <p className="text-muted-foreground mt-1" dir="rtl">خطّط وأدر أيام إجازتك السنوية (استمتع يا بطل! 😎)</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" dir="rtl">
              <CalendarDays className="h-5 h-5" />
              رصيد الإجازات {currentYear} 📊
            </CardTitle>
            <CardDescription dir="rtl">رصيدك من الإجازات السنوية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium" dir="rtl">الأيام الأساسية 📅</span>
                <span className="text-lg font-bold">{balance?.base_days || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium" dir="rtl">أيام الأوفر تايم 💪</span>
                <span className="text-lg font-bold text-primary">{balance?.overtime_days || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary text-primary-foreground rounded-lg">
                <span className="text-sm font-medium" dir="rtl">إجمالي الأيام العادية 🎯</span>
                <span className="text-lg font-bold">{balance?.total_days || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium" dir="rtl">الأيام المستخدمة 📉</span>
                <span className="text-lg font-bold text-destructive">{balance?.used_days || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <span className="text-sm font-medium" dir="rtl">المتبقي (عادي) 🎉</span>
                <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {balance?.remaining_days || 0}
                </span>
              </div>
              <div className="border-t pt-3 mt-3">
                <p className="text-xs text-muted-foreground mb-2 font-semibold" dir="rtl">إجازات الطوارئ 🚨</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                    <span className="text-sm font-medium" dir="rtl">أيام الطوارئ 🆘</span>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{balance?.emergency_days || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium" dir="rtl">المستخدم (طوارئ) 📉</span>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">{balance?.emergency_used_days || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <span className="text-sm font-medium" dir="rtl">المتبقي (طوارئ) 🎊</span>
                    <span className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                      {balance?.emergency_remaining_days || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle dir="rtl">اختر أيام الإجازة 📅</CardTitle>
            <CardDescription dir="rtl">
              اضغط على الأيام عشان تختار إجازتك. الأيام المحجوزة من زملائك ما تقدر تختارها 🚫
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => setSelectedDates(dates || [])}
                disabled={(date) => {
                  const today = startOfDay(new Date());
                  const checkDate = startOfDay(date);
                  return checkDate < today || isDateDisabled(date);
                }}
                className="rounded-md border"
              />
            </div>

            {selectedDates.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="font-medium" dir="rtl">الأيام المختارة: 📅</span>
                  <span className="text-lg font-bold">{selectedDates.length}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedDates
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((date, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {format(date, 'MMM dd, yyyy')}
                      </Badge>
                    ))}
                </div>

                <Button
                  onClick={() => {
                    console.log('Submit button clicked');
                    console.log('Selected dates:', selectedDates);
                    console.log('Balance:', balance);
                    setShowSubmitDialog(true);
                  }}
                  className="w-full"
                  disabled={selectedDates.length === 0 || (balance?.remaining_days || 0) < selectedDates.length}
                  dir="rtl"
                >
                  قدّم طلب الإجازة ({selectedDates.length} يوم) 🚀
                </Button>

                {(balance?.remaining_days || 0) < selectedDates.length && (
                  <p className="text-sm text-destructive text-center" dir="rtl">
                    رصيدك ما يكفي! عندك بس {balance?.remaining_days || 0} يوم متبقي 😅
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="my-requests" className="w-full">
        <TabsList className="grid w-full xl:w-[400px] grid-cols-2">
          <TabsTrigger value="my-requests" dir="rtl">طلباتي 📋</TabsTrigger>
          <TabsTrigger value="team-calendar" dir="rtl">تقويم الفريق 👥</TabsTrigger>
        </TabsList>

        <TabsContent value="my-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle dir="rtl">طلبات الإجازة حقتي 📝</CardTitle>
              <CardDescription dir="rtl">شوف حالة طلبات الإجازة حقتك</CardDescription>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p dir="rtl">ما فيه طلبات إجازة بعد 🤷</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold" dir="rtl">{request.total_days} يوم</span>
                            {getStatusBadge(request.status)}
                            {request.leave_type && (
                              <Badge variant={request.leave_type === 'emergency' ? 'destructive' : 'secondary'} dir="rtl">
                                {request.leave_type === 'emergency' ? '🚨 طوارئ' : '📅 عادية'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground" dir="rtl">
                            تم الطلب بتاريخ {format(new Date(request.request_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        {request.status === 'approved' && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        {request.status === 'rejected' && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        {request.status === 'pending' && (
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                        )}
                        {request.status === 'cancelled' && (
                          <Ban className="h-5 w-5 text-gray-600" />
                        )}
                      </div>

                      {request.reason && (
                        <div className="text-sm">
                          <span className="font-medium">Reason: </span>
                          <span className="text-muted-foreground">{request.reason}</span>
                        </div>
                      )}

                      {request.leave_days && request.leave_days.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Dates:</p>
                          <div className="flex flex-wrap gap-2">
                            {request.leave_days
                              .sort((a, b) => new Date(a.leave_date).getTime() - new Date(b.leave_date).getTime())
                              .map((day) => (
                                <Badge key={day.id} variant="outline" className="text-xs">
                                  {format(new Date(day.leave_date), 'MMM dd')}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      )}

                      {request.approver && (
                        <div className="text-sm text-muted-foreground">
                          {request.status === 'approved' && `Approved by ${request.approver.full_name}`}
                          {request.status === 'rejected' && `Rejected by ${request.approver.full_name}`}
                          {request.approval_date && ` on ${format(new Date(request.approval_date), 'MMM dd, yyyy')}`}
                        </div>
                      )}

                      {request.rejection_reason && (
                        <div className="text-sm p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded">
                          <span className="font-medium text-red-900 dark:text-red-400">Rejection Reason: </span>
                          <span className="text-red-700 dark:text-red-300">{request.rejection_reason}</span>
                        </div>
                      )}

                      {request.cancellation_reason && (
                        <div className="text-sm p-3 bg-gray-50 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-800 rounded">
                          <span className="font-medium text-gray-900 dark:text-gray-400">Cancellation Reason: </span>
                          <span className="text-gray-700 dark:text-gray-300">{request.cancellation_reason}</span>
                        </div>
                      )}

                      {/* Cancellation Request Status */}
                      {request.status === 'approved' && (() => {
                        const cancelReq = getCancellationRequestStatus(request.id);
                        if (cancelReq) {
                          if (cancelReq.status === 'pending') {
                            return (
                              <div className="text-sm p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-yellow-600" />
                                  <span className="font-medium text-yellow-900 dark:text-yellow-400">
                                    Cancellation Request Pending
                                  </span>
                                </div>
                                {cancelReq.request_reason && (
                                  <p className="mt-1 text-yellow-700 dark:text-yellow-300">
                                    Reason: {cancelReq.request_reason}
                                  </p>
                                )}
                              </div>
                            );
                          } else if (cancelReq.status === 'rejected') {
                            return (
                              <div className="text-sm p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded">
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-red-600" />
                                  <span className="font-medium text-red-900 dark:text-red-400">
                                    Cancellation Request Rejected
                                  </span>
                                </div>
                                {cancelReq.admin_response && (
                                  <p className="mt-1 text-red-700 dark:text-red-300">
                                    Admin Response: {cancelReq.admin_response}
                                  </p>
                                )}
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}

                      {/* Request Cancellation Button */}
                      {request.status === 'approved' && !hasPendingCancellationRequest(request.id) && (
                        <div className="pt-3 border-t">
                          <Button
                            onClick={() => {
                              console.log('Request Cancellation button clicked');
                              console.log('Request:', request);
                              setSelectedLeaveForCancellation(request);
                              setCancellationRequestReason('');
                              setShowCancelRequestDialog(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/20"
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Request Cancellation
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team-calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Leave Calendar
              </CardTitle>
              <CardDescription>View approved leaves for your team members</CardDescription>
            </CardHeader>
            <CardContent>
              {teamLeaves.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No approved team leaves yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamLeaves
                    .filter(leave => leave.user_id !== user?.id)
                    .map((leave) => (
                      <div key={leave.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {leave.user?.full_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{leave.user?.full_name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{leave.user?.position || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{format(new Date(leave.leave_date), 'MMM dd, yyyy')}</p>
                          <Badge variant="secondary" className="text-xs">On Leave</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Leave Request</DialogTitle>
            <DialogDescription>
              You are requesting {selectedDates.length} day(s) of leave. Select the type and add an optional reason below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select value={leaveType} onValueChange={(value: 'normal' | 'emergency') => setLeaveType(value)}>
                <SelectTrigger id="leaveType">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">
                    📅 Normal Leave ({balance?.remaining_days || 0} days remaining)
                  </SelectItem>
                  <SelectItem value="emergency">
                    🚨 Emergency Leave ({balance?.emergency_remaining_days || 0} days remaining)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {leaveType === 'emergency' 
                  ? 'Emergency leave is for urgent, unforeseen situations.'
                  : 'Normal leave is for planned annual vacation days.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for leave request..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Selected Dates:</p>
              <div className="flex flex-wrap gap-2">
                {selectedDates
                  .sort((a, b) => a.getTime() - b.getTime())
                  .map((date, index) => (
                    <Badge key={index} variant="secondary">
                      {format(date, 'MMM dd, yyyy')}
                    </Badge>
                  ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRequest} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancellation Request Dialog */}
      <Dialog open={showCancelRequestDialog} onOpenChange={setShowCancelRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Leave Cancellation</DialogTitle>
            <DialogDescription>
              Submit a request to cancel your approved leave. This requires admin approval.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedLeaveForCancellation && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Leave Details:</p>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Days:</span> {selectedLeaveForCancellation.total_days}</p>
                  <p><span className="font-medium">Type:</span> {selectedLeaveForCancellation.leave_type === 'emergency' ? '🚨 Emergency' : '📅 Normal'}</p>
                  {selectedLeaveForCancellation.leave_days && selectedLeaveForCancellation.leave_days.length > 0 && (
                    <div>
                      <p className="font-medium mb-1">Dates:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedLeaveForCancellation.leave_days
                          .sort((a, b) => new Date(a.leave_date).getTime() - new Date(b.leave_date).getTime())
                          .map((day) => (
                            <Badge key={day.id} variant="outline" className="text-xs">
                              {format(new Date(day.leave_date), 'MMM dd')}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-yellow-900 dark:text-yellow-400">Important:</p>
                  <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>This request requires admin approval</li>
                    <li>Your leave will remain active until approved</li>
                    <li>Balance will be restored only after approval</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellationReason">Reason for Cancellation (Optional)</Label>
              <Textarea
                id="cancellationReason"
                placeholder="Please explain why you want to cancel this leave..."
                value={cancellationRequestReason}
                onChange={(e) => setCancellationRequestReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCancelRequestDialog(false);
                setSelectedLeaveForCancellation(null);
                setCancellationRequestReason('');
              }} 
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRequestCancellation} 
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
