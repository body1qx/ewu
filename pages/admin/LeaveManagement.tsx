import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format, startOfYear, endOfYear } from 'date-fns';
import { CalendarDays, CheckCircle2, XCircle, AlertCircle, Users, Clock, Settings, Ban, Edit, AlertTriangle } from 'lucide-react';
import {
  getAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  getAllLeaveBalances,
  updateOvertimeDays,
  initializeLeaveBalancesForYear,
  getLeaveDaysWithUsers,
  cancelApprovedLeaveRequest,
  updateEmployeeLeaveBalance,
  getPendingCancellationRequests,
  respondToCancellationRequest,
} from '@/db/api';
import type { LeaveRequestWithDetails, EmployeeLeaveBalance, Profile, LeaveDay, LeaveCancellationRequestWithDetails } from '@/types/types';

export default function LeaveManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  const [pendingRequests, setPendingRequests] = useState<LeaveRequestWithDetails[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<LeaveRequestWithDetails[]>([]);
  const [rejectedRequests, setRejectedRequests] = useState<LeaveRequestWithDetails[]>([]);
  const [cancelledRequests, setCancelledRequests] = useState<LeaveRequestWithDetails[]>([]);
  const [balances, setBalances] = useState<Array<EmployeeLeaveBalance & { user?: Profile }>>([]);
  const [teamLeaves, setTeamLeaves] = useState<Array<LeaveDay & { user?: Profile }>>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestWithDetails | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [showOvertimeDialog, setShowOvertimeDialog] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<EmployeeLeaveBalance & { user?: Profile } | null>(null);
  const [overtimeDays, setOvertimeDays] = useState('0');

  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceFormData, setBalanceFormData] = useState({
    baseDays: 15,
    overtimeDays: 0,
    emergencyDays: 6,
    usedDays: 0,
    emergencyUsedDays: 0,
  });

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedCancelRequest, setSelectedCancelRequest] = useState<LeaveRequestWithDetails | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  const [pendingCancellationRequests, setPendingCancellationRequests] = useState<LeaveCancellationRequestWithDetails[]>([]);
  const [showCancellationResponseDialog, setShowCancellationResponseDialog] = useState(false);
  const [selectedCancellationRequest, setSelectedCancellationRequest] = useState<LeaveCancellationRequestWithDetails | null>(null);
  const [cancellationResponseAction, setCancellationResponseAction] = useState<'approve' | 'reject'>('approve');
  const [adminResponse, setAdminResponse] = useState('');

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pending, approved, rejected, cancelled, balancesData, leavesData, cancellationReqs] = await Promise.all([
        getAllLeaveRequests('pending'),
        getAllLeaveRequests('approved'),
        getAllLeaveRequests('rejected'),
        getAllLeaveRequests('cancelled'),
        getAllLeaveBalances(currentYear),
        getLeaveDaysWithUsers(
          format(startOfYear(new Date()), 'yyyy-MM-dd'),
          format(endOfYear(new Date()), 'yyyy-MM-dd'),
          'approved'
        ),
        getPendingCancellationRequests(),
      ]);

      setPendingRequests(pending);
      setApprovedRequests(approved);
      setRejectedRequests(rejected);
      setCancelledRequests(cancelled);
      setBalances(balancesData);
      setTeamLeaves(leavesData);
      setPendingCancellationRequests(cancellationReqs);
    } catch (error) {
      console.error('Error loading leave management data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load leave management data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: LeaveRequestWithDetails) => {
    if (!user?.id) return;

    setIsProcessing(true);
    try {
      const result = await approveLeaveRequest(request.id, user.id);

      if (result.success) {
        toast({
          title: 'Success',
          description: `Leave request for ${request.employee?.full_name} has been approved.`,
        });
        await loadData();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to approve leave request.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error approving leave request:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!user?.id || !selectedRequest || !rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await rejectLeaveRequest(selectedRequest.id, user.id, rejectionReason);

      if (result.success) {
        toast({
          title: 'Success',
          description: `Leave request for ${selectedRequest.employee?.full_name} has been rejected.`,
        });
        setShowRejectDialog(false);
        setSelectedRequest(null);
        setRejectionReason('');
        await loadData();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to reject leave request.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancellationResponse = async () => {
    if (!selectedCancellationRequest) return;

    setIsProcessing(true);
    try {
      const result = await respondToCancellationRequest(
        selectedCancellationRequest.id,
        cancellationResponseAction,
        adminResponse.trim() || undefined
      );

      if (result.success) {
        const actionText = cancellationResponseAction === 'approve' ? 'approved' : 'rejected';
        toast({
          title: 'Success',
          description: `Cancellation request has been ${actionText}.`,
        });
        setShowCancellationResponseDialog(false);
        setSelectedCancellationRequest(null);
        setAdminResponse('');
        await loadData();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to process cancellation request.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Exception during cancellation:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateOvertimeDays = async () => {
    if (!selectedBalance) return;

    const days = Number.parseInt(overtimeDays, 10);
    if (Number.isNaN(days) || days < 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid number of days.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateOvertimeDays(selectedBalance.user_id, currentYear, days);
      toast({
        title: 'Success',
        description: `Overtime days updated for ${selectedBalance.user?.full_name}.`,
      });
      setShowOvertimeDialog(false);
      setSelectedBalance(null);
      setOvertimeDays('0');
      await loadData();
    } catch (error) {
      console.error('Error updating overtime days:', error);
      toast({
        title: 'Error',
        description: 'Failed to update overtime days.',
        variant: 'destructive',
      });
    }
  };

  const handleManageBalance = (balance: EmployeeLeaveBalance & { user?: Profile }) => {
    setSelectedBalance(balance);
    setBalanceFormData({
      baseDays: balance.base_days,
      overtimeDays: balance.overtime_days,
      emergencyDays: balance.emergency_days,
      usedDays: balance.used_days,
      emergencyUsedDays: balance.emergency_used_days,
    });
    setShowBalanceDialog(true);
  };

  const handleUpdateBalance = async () => {
    if (!selectedBalance) return;

    const { baseDays, overtimeDays, emergencyDays, usedDays, emergencyUsedDays } = balanceFormData;

    if (baseDays < 0 || overtimeDays < 0 || emergencyDays < 0 || usedDays < 0 || emergencyUsedDays < 0) {
      toast({
        title: 'Invalid Input',
        description: 'All values must be non-negative.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await updateEmployeeLeaveBalance(
        selectedBalance.id,
        baseDays,
        overtimeDays,
        emergencyDays,
        usedDays,
        emergencyUsedDays
      );

      if (result.success) {
        toast({
          title: 'Success',
          description: `Leave balance updated for ${selectedBalance.user?.full_name}.`,
        });
        setShowBalanceDialog(false);
        setSelectedBalance(null);
        await loadData();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update balance.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelLeave = (request: LeaveRequestWithDetails) => {
    console.log('Cancel leave clicked for request:', request.id);
    setSelectedCancelRequest(request);
    setCancellationReason('');
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    console.log('=== CANCEL CONFIRMATION STARTED ===');
    console.log('User ID:', user?.id);
    console.log('Selected Request:', selectedCancelRequest);
    
    if (!user?.id || !selectedCancelRequest) {
      console.error('Missing user or request');
      toast({
        title: 'Error',
        description: 'Missing required information. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Confirming cancel for request:', selectedCancelRequest.id);
    setIsProcessing(true);
    
    try {
      console.log('Calling cancelApprovedLeaveRequest API...');
      const result = await cancelApprovedLeaveRequest(
        selectedCancelRequest.id,
        user.id,
        cancellationReason.trim() || undefined
      );

      console.log('Cancel result:', result);

      if (result.success) {
        toast({
          title: 'Success',
          description: `Leave request for ${selectedCancelRequest.employee?.full_name} has been cancelled and balance restored.`,
        });
        setShowCancelDialog(false);
        setSelectedCancelRequest(null);
        setCancellationReason('');
        console.log('Reloading data...');
        await loadData();
        console.log('Data reloaded successfully');
      } else {
        console.error('Cancel failed:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Failed to cancel leave request.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error cancelling leave request:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      console.log('=== CANCEL CONFIRMATION ENDED ===');
    }
  };

  const handleInitializeBalances = async () => {
    try {
      const count = await initializeLeaveBalancesForYear(currentYear);
      toast({
        title: 'Success',
        description: `Initialized leave balances for ${count} employees.`,
      });
      await loadData();
    } catch (error) {
      console.error('Error initializing balances:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize leave balances.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600 hover:bg-green-700">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-600 hover:bg-red-700">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-600 hover:bg-gray-700">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const renderRequestCard = (request: LeaveRequestWithDetails, showActions = false) => (
    <div key={request.id} className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{request.employee?.full_name || 'Unknown'}</span>
            <Badge variant="outline">{request.employee?.position || 'N/A'}</Badge>
            {getStatusBadge(request.status)}
            {request.leave_type && (
              <Badge variant={request.leave_type === 'emergency' ? 'destructive' : 'secondary'}>
                {request.leave_type === 'emergency' ? '🚨 Emergency' : '📅 Normal'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {request.total_days} days • Requested on {format(new Date(request.request_date), 'MMM dd, yyyy')}
          </p>
          {request.employee?.team && (
            <p className="text-sm text-muted-foreground">Team: {request.employee.team}</p>
          )}
        </div>
        {request.status === 'approved' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
        {request.status === 'rejected' && <XCircle className="h-5 w-5 text-red-600" />}
        {request.status === 'pending' && <AlertCircle className="h-5 w-5 text-yellow-600" />}
        {request.status === 'cancelled' && <Ban className="h-5 w-5 text-gray-600" />}
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
                  {format(new Date(day.leave_date), 'MMM dd, yyyy')}
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

      {showActions && request.status === 'pending' && (
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => handleApprove(request)}
            disabled={isProcessing}
            className="flex-1"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Approve
          </Button>
          <Button
            onClick={() => {
              setSelectedRequest(request);
              setShowRejectDialog(true);
            }}
            disabled={isProcessing}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
        </div>
      )}

      {request.status === 'approved' && (
        <div className="pt-2 border-t">
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('NEW CANCEL BUTTON CLICKED - Request ID:', request.id);
              setSelectedCancelRequest(request);
              setCancellationReason('');
              setShowCancelDialog(true);
            }}
            disabled={isProcessing}
            variant="destructive"
            size="sm"
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <Ban className="h-4 w-4 mr-2" />
            Cancel This Approved Leave
          </Button>
        </div>
      )}
    </div>
  );

  const filteredBalances = balances.filter(balance => {
    if (filterTeam !== 'all' && balance.user?.team !== filterTeam) return false;
    return true;
  });

  const teams = Array.from(new Set(balances.map(b => b.user?.team).filter(team => team && team.trim() !== ''))) as string[];

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading leave management data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground mt-1">Manage employee annual leave requests and balances</p>
        </div>
        <Button onClick={handleInitializeBalances} variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Initialize Balances
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedRequests.length}</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedRequests.length}</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balances.length}</div>
            <p className="text-xs text-muted-foreground">With leave balances</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full xl:w-[700px] grid-cols-5">
          <TabsTrigger value="pending">
            Pending
            {pendingRequests.length > 0 && (
              <Badge className="ml-2 bg-yellow-600">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="cancellations">
            Cancellations
            {pendingCancellationRequests.length > 0 && (
              <Badge className="ml-2 bg-orange-600">{pendingCancellationRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Leave Requests</CardTitle>
              <CardDescription>Review and approve or reject leave requests</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No pending requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => renderRequestCard(request, true))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cancellations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cancellation Requests</CardTitle>
              <CardDescription>Review employee requests to cancel approved leave</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingCancellationRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No pending cancellation requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingCancellationRequests.map((cancelReq) => (
                    <div
                      key={cancelReq.id}
                      className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-lg">
                              {cancelReq.leave_request?.employee?.full_name || 'Unknown Employee'}
                            </span>
                            <Badge className="bg-orange-600 hover:bg-orange-700">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Cancellation Request
                            </Badge>
                            {cancelReq.leave_request?.leave_type && (
                              <Badge variant={cancelReq.leave_request.leave_type === 'emergency' ? 'destructive' : 'secondary'}>
                                {cancelReq.leave_request.leave_type === 'emergency' ? '🚨 Emergency' : '📅 Normal'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Requested on {format(new Date(cancelReq.requested_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>

                      {cancelReq.leave_request && (
                        <div className="p-3 bg-muted rounded space-y-2">
                          <p className="text-sm font-medium">Original Leave Details:</p>
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium">Days:</span> {cancelReq.leave_request.total_days}</p>
                            {cancelReq.leave_request.leave_days && cancelReq.leave_request.leave_days.length > 0 && (
                              <div>
                                <p className="font-medium mb-1">Dates:</p>
                                <div className="flex flex-wrap gap-1">
                                  {cancelReq.leave_request.leave_days
                                    .sort((a, b) => new Date(a.leave_date).getTime() - new Date(b.leave_date).getTime())
                                    .map((day) => (
                                      <Badge key={day.id} variant="outline" className="text-xs">
                                        {format(new Date(day.leave_date), 'MMM dd, yyyy')}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {cancelReq.request_reason && (
                        <div className="text-sm p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded">
                          <span className="font-medium text-yellow-900 dark:text-yellow-400">Employee's Reason: </span>
                          <span className="text-yellow-700 dark:text-yellow-300">{cancelReq.request_reason}</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => {
                            setSelectedCancellationRequest(cancelReq);
                            setCancellationResponseAction('approve');
                            setAdminResponse('');
                            setShowCancellationResponseDialog(true);
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve Cancellation
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedCancellationRequest(cancelReq);
                            setCancellationResponseAction('reject');
                            setAdminResponse('');
                            setShowCancellationResponseDialog(true);
                          }}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Request
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Leave Requests</CardTitle>
              <CardDescription>View all approved leave requests for {currentYear}</CardDescription>
            </CardHeader>
            <CardContent>
              {approvedRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No approved requests yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvedRequests.map((request) => renderRequestCard(request, false))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rejected Leave Requests</CardTitle>
              <CardDescription>View all rejected leave requests for {currentYear}</CardDescription>
            </CardHeader>
            <CardContent>
              {rejectedRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <XCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No rejected requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rejectedRequests.map((request) => renderRequestCard(request, false))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cancelled Leave Requests</CardTitle>
              <CardDescription>View all cancelled leave requests for {currentYear}</CardDescription>
            </CardHeader>
            <CardContent>
              {cancelledRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Ban className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No cancelled requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cancelledRequests.map((request) => renderRequestCard(request, false))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Leave Balances {currentYear}</CardTitle>
              <CardDescription>Manage annual leave allocations and overtime days</CardDescription>
              <div className="pt-4">
                <Select value={filterTeam} onValueChange={setFilterTeam}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team} value={team}>{team}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredBalances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No employee balances found</p>
                  <Button onClick={handleInitializeBalances} className="mt-4">
                    Initialize Balances for {currentYear}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBalances.map((balance) => (
                    <div key={balance.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{balance.user?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            {balance.user?.position || 'N/A'} • {balance.user?.team || 'No Team'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedBalance(balance);
                              setOvertimeDays(balance.overtime_days.toString());
                              setShowOvertimeDialog(true);
                            }}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Edit Overtime
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleManageBalance(balance)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Manage Balance
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 xl:grid-cols-7 gap-3">
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="text-xs text-muted-foreground">Base</p>
                          <p className="text-lg font-bold">{balance.base_days}</p>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="text-xs text-muted-foreground">Overtime</p>
                          <p className="text-lg font-bold text-primary">{balance.overtime_days}</p>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="text-xs text-muted-foreground">Emergency</p>
                          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{balance.emergency_days}</p>
                        </div>
                        <div className="text-center p-2 bg-primary text-primary-foreground rounded">
                          <p className="text-xs">Total</p>
                          <p className="text-lg font-bold">{balance.total_days}</p>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="text-xs text-muted-foreground">Used</p>
                          <p className="text-lg font-bold text-destructive">{balance.used_days}</p>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="text-xs text-muted-foreground">Emerg. Used</p>
                          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{balance.emergency_used_days}</p>
                        </div>
                        <div className="text-center p-2 bg-green-100 dark:bg-green-900/20 rounded">
                          <p className="text-xs text-muted-foreground">Remaining</p>
                          <p className="text-lg font-bold text-green-700 dark:text-green-400">
                            {balance.remaining_days} + {balance.emergency_remaining_days}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Team Leave Calendar
              </CardTitle>
              <CardDescription>View all approved leaves across the organization</CardDescription>
            </CardHeader>
            <CardContent>
              {teamLeaves.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No approved leaves yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamLeaves.map((leave) => (
                    <div key={leave.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {leave.user?.full_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{leave.user?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            {leave.user?.position || 'N/A'} • {leave.user?.team || 'No Team'}
                          </p>
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

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this leave request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setSelectedRequest(null);
                setRejectionReason('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancellation Response Dialog */}
      <Dialog open={showCancellationResponseDialog} onOpenChange={setShowCancellationResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {cancellationResponseAction === 'approve' ? 'Approve' : 'Reject'} Cancellation Request
            </DialogTitle>
            <DialogDescription>
              {cancellationResponseAction === 'approve'
                ? 'Approving this will cancel the leave and restore the employee\'s balance.'
                : 'Rejecting this will keep the leave active and deny the cancellation request.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedCancellationRequest?.leave_request && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Leave Details:</p>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Employee:</span> {selectedCancellationRequest.leave_request.employee?.full_name}</p>
                  <p><span className="font-medium">Days:</span> {selectedCancellationRequest.leave_request.total_days}</p>
                  <p><span className="font-medium">Type:</span> {selectedCancellationRequest.leave_request.leave_type === 'emergency' ? '🚨 Emergency' : '📅 Normal'}</p>
                </div>
              </div>
            )}

            {selectedCancellationRequest?.request_reason && (
              <div className="text-sm p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded">
                <span className="font-medium text-yellow-900 dark:text-yellow-400">Employee's Reason: </span>
                <span className="text-yellow-700 dark:text-yellow-300">{selectedCancellationRequest.request_reason}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin-response">
                Admin Response (Optional)
              </Label>
              <Textarea
                id="admin-response"
                placeholder={cancellationResponseAction === 'approve' 
                  ? 'Add a note about the approval...' 
                  : 'Explain why the request is being rejected...'}
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                rows={4}
              />
            </div>

            {cancellationResponseAction === 'approve' && (
              <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-green-900 dark:text-green-400">This will:</p>
                    <ul className="list-disc list-inside text-green-700 dark:text-green-300 space-y-1">
                      <li>Cancel the approved leave</li>
                      <li>Restore {selectedCancellationRequest?.leave_request?.total_days} days to employee's balance</li>
                      <li>Notify the employee of the approval</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancellationResponseDialog(false);
                setSelectedCancellationRequest(null);
                setAdminResponse('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCancellationResponse}
              disabled={isProcessing}
              className={cancellationResponseAction === 'approve' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'}
            >
              {isProcessing 
                ? 'Processing...' 
                : cancellationResponseAction === 'approve' 
                  ? 'Approve Cancellation' 
                  : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showOvertimeDialog} onOpenChange={setShowOvertimeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Overtime Days</DialogTitle>
            <DialogDescription>
              Adjust overtime leave days for {selectedBalance?.user?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="overtime-days">Overtime Days</Label>
              <Input
                id="overtime-days"
                type="number"
                min="0"
                value={overtimeDays}
                onChange={(e) => setOvertimeDays(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Current: {selectedBalance?.overtime_days || 0} days
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowOvertimeDialog(false);
                setSelectedBalance(null);
                setOvertimeDays('0');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateOvertimeDays}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Balance Management Dialog */}
      <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Leave Balance</DialogTitle>
            <DialogDescription>
              Update all leave balance fields for {selectedBalance?.user?.full_name}. Changes will take effect immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseDays">Base Annual Days</Label>
                <Input
                  id="baseDays"
                  type="number"
                  min="0"
                  value={balanceFormData.baseDays}
                  onChange={(e) => setBalanceFormData({ ...balanceFormData, baseDays: Number.parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Standard annual leave allocation (default: 15)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtimeDays">Overtime Days</Label>
                <Input
                  id="overtimeDays"
                  type="number"
                  min="0"
                  value={balanceFormData.overtimeDays}
                  onChange={(e) => setBalanceFormData({ ...balanceFormData, overtimeDays: Number.parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Extra days earned from overtime</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyDays">Emergency Days</Label>
                <Input
                  id="emergencyDays"
                  type="number"
                  min="0"
                  value={balanceFormData.emergencyDays}
                  onChange={(e) => setBalanceFormData({ ...balanceFormData, emergencyDays: Number.parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Emergency leave allocation (default: 6)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="usedDays">Used Days (Normal)</Label>
                <Input
                  id="usedDays"
                  type="number"
                  min="0"
                  value={balanceFormData.usedDays}
                  onChange={(e) => setBalanceFormData({ ...balanceFormData, usedDays: Number.parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Normal leave days already used</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyUsedDays">Used Days (Emergency)</Label>
                <Input
                  id="emergencyUsedDays"
                  type="number"
                  min="0"
                  value={balanceFormData.emergencyUsedDays}
                  onChange={(e) => setBalanceFormData({ ...balanceFormData, emergencyUsedDays: Number.parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Emergency leave days already used</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Total Normal Leave:</p>
                  <p className="text-lg font-bold">{balanceFormData.baseDays + balanceFormData.overtimeDays} days</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Remaining Normal:</p>
                  <p className="text-lg font-bold text-green-600">
                    {balanceFormData.baseDays + balanceFormData.overtimeDays - balanceFormData.usedDays} days
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Total Emergency Leave:</p>
                  <p className="text-lg font-bold text-orange-600">{balanceFormData.emergencyDays} days</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Remaining Emergency:</p>
                  <p className="text-lg font-bold text-orange-600">
                    {balanceFormData.emergencyDays - balanceFormData.emergencyUsedDays} days
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBalanceDialog(false);
                setSelectedBalance(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateBalance} disabled={isProcessing}>
              {isProcessing ? 'Updating...' : 'Update Balance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Leave Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={(open) => {
        console.log('Dialog onOpenChange called:', open);
        if (!open && !isProcessing) {
          setShowCancelDialog(false);
          setSelectedCancelRequest(null);
          setCancellationReason('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Approved Leave Request</DialogTitle>
            <DialogDescription>
              This will cancel the approved leave and restore the employee's balance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedCancelRequest && (
              <div className="bg-muted p-3 rounded-lg space-y-1">
                <p className="text-sm font-medium">Employee: {selectedCancelRequest.employee?.full_name}</p>
                <p className="text-sm text-muted-foreground">Days: {selectedCancelRequest.total_days}</p>
                <p className="text-sm text-muted-foreground">Type: {selectedCancelRequest.leave_type === 'emergency' ? 'Emergency' : 'Normal'}</p>
              </div>
            )}
            
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                This action will:
              </p>
              <ul className="text-sm text-yellow-800 dark:text-yellow-300 list-disc list-inside space-y-1 ml-2">
                <li>Restore {selectedCancelRequest?.total_days} days to balance</li>
                <li>Remove schedule entries</li>
                <li>Notify the employee</li>
                <li>Cannot be undone</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Cancellation Reason (Optional)</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Why is this leave being cancelled?"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
                disabled={isProcessing}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                console.log('Keep Leave clicked');
                setShowCancelDialog(false);
                setSelectedCancelRequest(null);
                setCancellationReason('');
              }}
              disabled={isProcessing}
            >
              No, Keep Leave
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                console.log('=== YES CANCEL BUTTON CLICKED ===');
                
                if (!user?.id || !selectedCancelRequest) {
                  console.error('Missing data:', { userId: user?.id, request: selectedCancelRequest });
                  toast({
                    title: 'Error',
                    description: 'Missing required information',
                    variant: 'destructive',
                  });
                  return;
                }

                setIsProcessing(true);
                console.log('Processing cancellation for request:', selectedCancelRequest.id);
                
                try {
                  console.log('Calling API...');
                  const result = await cancelApprovedLeaveRequest(
                    selectedCancelRequest.id,
                    user.id,
                    cancellationReason.trim() || undefined
                  );

                  console.log('API Result:', result);

                  if (result.success) {
                    toast({
                      title: 'Leave Cancelled',
                      description: `Successfully cancelled leave for ${selectedCancelRequest.employee?.full_name}. Balance has been restored.`,
                    });
                    
                    setShowCancelDialog(false);
                    setSelectedCancelRequest(null);
                    setCancellationReason('');
                    
                    console.log('Reloading data...');
                    await loadData();
                    console.log('Data reloaded');
                  } else {
                    console.error('Cancellation failed:', result.error);
                    toast({
                      title: 'Cancellation Failed',
                      description: result.error || 'Could not cancel leave request',
                      variant: 'destructive',
                    });
                  }
                } catch (error) {
                  console.error('Exception during cancellation:', error);
                  toast({
                    title: 'Error',
                    description: error instanceof Error ? error.message : 'An unexpected error occurred',
                    variant: 'destructive',
                  });
                } finally {
                  setIsProcessing(false);
                  console.log('=== CANCELLATION PROCESS ENDED ===');
                }
              }}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Cancelling...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-2" />
                  Yes, Cancel Leave
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
