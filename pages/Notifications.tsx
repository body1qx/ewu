import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/db/supabase';
import { Bell, BellOff, Check, CheckCheck, Trash2, AlertCircle, FileText, Megaphone, Shield, User, ExternalLink, Clock, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'system' | 'announcement' | 'file' | 'admin' | 'status' | 'shift_handover' | 'warning';
  is_read: boolean;
  created_at: string;
  link?: string;
  metadata?: Record<string, any>;
}

export default function Notifications() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );

      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        variant: 'destructive',
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      toast({
        title: 'Success',
        description: 'Notification deleted',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate to link if available
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'announcement':
        return <Megaphone className="h-5 w-5 text-accent" />;
      case 'file':
        return <FileText className="h-5 w-5 text-green-500" />;
      case 'admin':
        return <Shield className="h-5 w-5 text-purple-500" />;
      case 'status':
        return <User className="h-5 w-5 text-orange-500" />;
      case 'shift_handover':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getNotificationTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      system: 'System',
      announcement: 'Announcement',
      file: 'File',
      admin: 'Admin',
      status: 'Status',
      shift_handover: 'Shift Handover',
      warning: 'Warning',
    };
    return variants[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins} min${diffInMins > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const isNewNotification = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / 3600000);
    return diffInHours < 24;
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold gradient-text flex items-center gap-3">
            <Bell className="h-10 w-10" />
            Notifications
          </h1>
          {unreadCount > 0 && (
            <Badge variant="default" className="text-lg px-3 py-1">
              {unreadCount} Unread
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">Stay updated with your latest notifications</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Notifications</CardTitle>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline" size="sm">
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All as Read
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="all">
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread ({unreadCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="space-y-4">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <BellOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                  <p className="text-muted-foreground">
                    {filter === 'unread' 
                      ? "You're all caught up! No unread notifications."
                      : "You don't have any notifications yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div
                        className={`p-4 rounded-lg border transition-colors ${
                          notification.is_read
                            ? 'bg-background border-border'
                            : 'bg-accent/5 border-accent/20'
                        } ${notification.link ? 'cursor-pointer hover:border-accent/40' : ''}`}
                        onClick={() => notification.link && handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm">
                                  {notification.title}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  {getNotificationTypeBadge(notification.type)}
                                </Badge>
                                {isNewNotification(notification.created_at) && (
                                  <Badge variant="default" className="text-xs">
                                    NEW
                                  </Badge>
                                )}
                                {!notification.is_read && (
                                  <Badge variant="secondary" className="text-xs">
                                    Unread
                                  </Badge>
                                )}
                                {notification.link && (
                                  <Badge variant="secondary" className="text-xs">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Clickable
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(notification.created_at)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3">
                              {notification.message}
                            </p>

                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              {notification.link && (
                                <Button
                                  onClick={() => handleNotificationClick(notification)}
                                  variant="default"
                                  size="sm"
                                  className="h-8 text-xs"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              )}
                              {!notification.is_read && (
                                <Button
                                  onClick={() => markAsRead(notification.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Mark as Read
                                </Button>
                              )}
                              <Button
                                onClick={() => deleteNotification(notification.id)}
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < filteredNotifications.length - 1 && <Separator className="my-3" />}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
