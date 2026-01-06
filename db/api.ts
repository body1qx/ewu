import { supabase } from './supabase';
import { format, addDays } from 'date-fns';
import type {
  Profile,
  Announcement,
  KnowledgeCategory,
  KnowledgeArticle,
  Tool,
  FileRecord,
  Notification,
  UserStatus,
  UserRole,
  EmployeePosition,
  Schedule,
  ScheduleWithEmployee,
  ShiftStatus,
  TaskStatistics,
  EmployeeTaskLoad,
  EmployeeLeaveBalance,
  LeaveRequest,
  LeaveRequestWithDetails,
  LeaveDay,
  LeaveConflict,
  LeaveCancellationRequest,
  LeaveCancellationRequestWithDetails,
  CancellationRequestStatus,
  CSFile,
  CSFileWithUploader,
  FileCategory,
  FileType,
  FileFilters,
  FoodPoisoningCase,
  FoodPoisoningCaseWithCreator,
  Branch,
  BranchStatus,
  CustomerBlacklist,
  CustomerBlacklistStatus,
  CaseNote,
  CaseNoteUpdate,
  CaseStatistics,
  CaseStatus,
  MenuItem,
  CommonIssue,
  Promotion,
  Break,
  BreakType,
  BreakSource,
  AttendanceSession,
  MyBreaksToday,
  DailyBreakReportRow,
  DetailedBreakReportRow,
  LiveBreakMonitor,
  BreakWithEmployee,
  SystemSettings,
  EmployeeWarning,
  WarningTemplate,
  WarningStats,
  WarningWithIssuer,
  Dashboard,
  DashboardWidget,
  DashboardWithWidgets,
  WidgetTypeDefinition,
  DashboardPermission,
  DashboardTaskType,
  DashboardTask,
  DashboardTaskWithDetails,
  DashboardTaskStatus,
  WidgetData,
} from '@/types/types';

// Profile APIs
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const getAllProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateUserStatus = async (userId: string, status: UserStatus): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('id', userId);
  
  if (error) throw error;
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);
  
  if (error) throw error;
};

export const updateUserSchedulability = async (userId: string, isSchedulable: boolean): Promise<void> => {
  const { error } = await supabase.rpc('update_user_schedulability', {
    user_id: userId,
    schedulable: isSchedulable,
  });
  
  if (error) throw error;
};

export const getSchedulableUsers = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'active')
    .eq('is_schedulable', true)
    .order('full_name', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const updateUserPosition = async (userId: string, position: EmployeePosition | null): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ position })
    .eq('id', userId);
  
  if (error) throw error;
};

export const updateUserEmail = async (userId: string, email: string): Promise<void> => {
  const { error } = await supabase.auth.admin.updateUserById(userId, { email });
  if (error) throw error;
  
  // Also update in profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ email })
    .eq('id', userId);
  
  if (profileError) throw profileError;
};

export const updateUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('update-user-password', {
    body: { userId, newPassword },
  });

  if (error) {
    const errorMsg = await error?.context?.text();
    console.error('Edge function error in update-user-password:', errorMsg);
    throw new Error(errorMsg || 'Failed to update password');
  }

  if (data?.error) {
    throw new Error(data.error);
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('delete-user', {
    body: { userId },
  });

  if (error) {
    console.error('Edge function error in delete-user:', error);
    throw new Error(error.message || 'Failed to delete user');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.success) {
    throw new Error('Failed to delete user');
  }
};

export const getEmployeesWithPositions = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'active')
    .not('position', 'is', null)
    .order('full_name', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const updateLastLogin = async (userId: string): Promise<void> => {
  const { error } = await supabase.rpc('update_last_login', { user_id: userId });
  if (error) throw error;
};

// Announcement APIs
export const getPublishedAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        creator:created_by(
          id,
          full_name,
          profile_image_url,
          position
        )
      `)
      .eq('status', 'published')
      .or('scheduled_date.is.null,scheduled_date.lte.' + new Date().toISOString())
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching published announcements:', error);
      // Fallback: fetch without creator info if join fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('announcements')
        .select('*')
        .eq('status', 'published')
        .or('scheduled_date.is.null,scheduled_date.lte.' + new Date().toISOString())
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (fallbackError) throw fallbackError;
      return Array.isArray(fallbackData) ? fallbackData : [];
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Fatal error in getPublishedAnnouncements:', err);
    return [];
  }
};

export const getAllAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        creator:created_by(
          id,
          full_name,
          profile_image_url,
          position
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all announcements:', error);
      // Fallback: fetch without creator info if join fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fallbackError) throw fallbackError;
      return Array.isArray(fallbackData) ? fallbackData : [];
    }
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Fatal error in getAllAnnouncements:', err);
    return [];
  }
};

export const getAnnouncements = async (): Promise<Announcement[]> => {
  return getAllAnnouncements();
};

export const getAnnouncementById = async (id: string): Promise<Announcement | null> => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        creator:created_by(
          id,
          full_name,
          profile_image_url,
          position
        )
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching announcement by id:', error);
      // Fallback: fetch without creator info if join fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (fallbackError) throw fallbackError;
      return fallbackData;
    }
    return data;
  } catch (err) {
    console.error('Fatal error in getAnnouncementById:', err);
    return null;
  }
};

export const searchAnnouncements = async (query: string): Promise<Announcement[]> => {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%,message.ilike.%${query}%`)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const filterAnnouncementsByPriority = async (priority: string): Promise<Announcement[]> => {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('priority', priority)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const filterAnnouncementsByWriter = async (writerId: string): Promise<Announcement[]> => {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('created_by', writerId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createAnnouncement = async (announcement: Partial<Announcement>): Promise<Announcement | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      ...announcement,
      created_by: user?.id,
    })
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateAnnouncement = async (id: string, updates: Partial<Announcement>): Promise<Announcement | null> => {
  const { data, error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const uploadAnnouncementBanner = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('shawarmer_announcements')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('shawarmer_announcements')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

/**
 * Upload an image to announcement_images storage
 * Returns the public URL of the uploaded image
 */
export const uploadAnnouncementImage = async (file: File): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size must be less than 10MB');
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('announcement_images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading image:', error);
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('announcement_images')
    .getPublicUrl(data.path);

  return publicUrl;
};

/**
 * Delete an image from announcement_images storage
 */
export const deleteAnnouncementImage = async (imageUrl: string): Promise<void> => {
  // Extract path from URL
  const urlParts = imageUrl.split('/announcement_images/');
  if (urlParts.length < 2) {
    throw new Error('Invalid image URL');
  }
  
  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('announcement_images')
    .remove([filePath]);

  if (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// Knowledge Category APIs
export const getAllCategories = async (): Promise<KnowledgeCategory[]> => {
  const { data, error } = await supabase
    .from('kb_categories')
    .select('*')
    .order('display_order', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getCategoryById = async (id: string): Promise<KnowledgeCategory | null> => {
  const { data, error } = await supabase
    .from('kb_categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const createCategory = async (category: Partial<KnowledgeCategory>): Promise<KnowledgeCategory | null> => {
  const { data, error } = await supabase
    .from('kb_categories')
    .insert(category)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateCategory = async (id: string, updates: Partial<KnowledgeCategory>): Promise<KnowledgeCategory | null> => {
  const { data, error } = await supabase
    .from('kb_categories')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('kb_categories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Knowledge Article APIs
export const getAllArticles = async (): Promise<KnowledgeArticle[]> => {
  const { data, error } = await supabase
    .from('kb_articles')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getArticlesByCategory = async (categoryId: string): Promise<KnowledgeArticle[]> => {
  const { data, error } = await supabase
    .from('kb_articles')
    .select('*')
    .eq('category_id', categoryId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const searchArticles = async (query: string): Promise<KnowledgeArticle[]> => {
  const { data, error } = await supabase
    .from('kb_articles')
    .select('*')
    .eq('status', 'published')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getArticleById = async (id: string): Promise<KnowledgeArticle | null> => {
  const { data, error } = await supabase
    .from('kb_articles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const createArticle = async (article: Partial<KnowledgeArticle>): Promise<KnowledgeArticle | null> => {
  const { data, error } = await supabase
    .from('kb_articles')
    .insert(article)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateArticle = async (id: string, updates: Partial<KnowledgeArticle>): Promise<KnowledgeArticle | null> => {
  const { data, error } = await supabase
    .from('kb_articles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const deleteArticle = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('kb_articles')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const duplicateArticle = async (articleId: string, userId: string): Promise<KnowledgeArticle | null> => {
  // Get the original article
  const original = await getArticleById(articleId);
  if (!original) throw new Error('Article not found');
  
  // Create a copy with modified title and reset certain fields
  const copy: Partial<KnowledgeArticle> = {
    title: `Copy of ${original.title}`,
    description: original.description,
    content: original.content,
    content_blocks: original.content_blocks,
    category_id: original.category_id,
    tags: original.tags,
    author_id: userId,
    status: 'draft', // Always create as draft
    pinned: false, // Don't copy pinned status
    view_count: 0, // Reset view count
  };
  
  return await createArticle(copy);
};

export const getMyDraftArticles = async (authorId: string): Promise<KnowledgeArticle[]> => {
  const { data, error } = await supabase
    .from('kb_articles')
    .select('*')
    .eq('author_id', authorId)
    .eq('status', 'draft')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Increment article view count
export const incrementArticleViews = async (articleId: string): Promise<void> => {
  const { error } = await supabase.rpc('increment_article_views', {
    article_id: articleId
  });
  
  if (error) throw error;
};

// Favorite APIs
export const addFavorite = async (articleId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('kb_favorites')
    .insert({ article_id: articleId, user_id: userId });
  
  if (error) throw error;
};

export const removeFavorite = async (articleId: string, userId: string): Promise<void> => {
  const { error } = await supabase
    .from('kb_favorites')
    .delete()
    .eq('article_id', articleId)
    .eq('user_id', userId);
  
  if (error) throw error;
};

export const isFavorited = async (articleId: string, userId: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('is_article_favorited', {
    article_id: articleId,
    user_id: userId
  });
  
  if (error) throw error;
  return data || false;
};

export const getUserFavorites = async (userId: string): Promise<KnowledgeArticle[]> => {
  const { data, error } = await supabase.rpc('get_user_favorites', {
    user_id: userId
  });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Image upload for KB articles
export const uploadKBImage = async (file: File, articleId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${articleId}/${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('kb_images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) throw uploadError;
  
  const { data } = supabase.storage
    .from('kb_images')
    .getPublicUrl(fileName);
  
  return data.publicUrl;
};

export const deleteKBImage = async (imageUrl: string): Promise<void> => {
  // Extract file path from URL
  const urlParts = imageUrl.split('/kb_images/');
  if (urlParts.length < 2) return;
  
  const filePath = urlParts[1];
  
  const { error } = await supabase.storage
    .from('kb_images')
    .remove([filePath]);
  
  if (error) throw error;
};

// Tool Category APIs
export const getAllToolCategories = async () => {
  const { data, error } = await supabase
    .from('tool_categories')
    .select('*')
    .order('order_index', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Tool APIs
export const getAllTools = async (): Promise<Tool[]> => {
  const { data, error } = await supabase
    .from('tools')
    .select('*, category:tool_categories(*)')
    .eq('is_active', true)
    .order('order_index', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getToolsByCategory = async (categoryId: string): Promise<Tool[]> => {
  const { data, error } = await supabase
    .from('tools')
    .select('*, category:tool_categories(*)')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('order_index', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createTool = async (tool: Partial<Tool>): Promise<Tool | null> => {
  const { data, error } = await supabase
    .from('tools')
    .insert(tool)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateTool = async (id: string, updates: Partial<Tool>): Promise<Tool | null> => {
  const { data, error } = await supabase
    .from('tools')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateToolOrder = async (id: string, orderIndex: number): Promise<void> => {
  const { error } = await supabase
    .from('tools')
    .update({ order_index: orderIndex })
    .eq('id', id);
  
  if (error) throw error;
};

export const deleteTool = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('tools')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const uploadToolLogo = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('app-7tw4zia1j9j5_tool_logos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('app-7tw4zia1j9j5_tool_logos')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// File APIs
export const getAllFiles = async (): Promise<FileRecord[]> => {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createFileRecord = async (file: Partial<FileRecord>): Promise<FileRecord | null> => {
  const { data, error } = await supabase
    .from('files')
    .insert(file)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const deleteFileRecord = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('files')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Notification APIs
export const getUserNotifications = async (userId: string, limit = 50): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getUnreadNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  
  if (error) throw error;
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  
  if (error) throw error;
};

export const createNotification = async (notification: Partial<Notification>): Promise<Notification | null> => {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const createNotificationForAllUsers = async (
  title: string,
  message: string,
  type: Notification['type']
): Promise<void> => {
  const profiles = await getAllProfiles();
  const notifications = profiles.map(profile => ({
    user_id: profile.id,
    title,
    message,
    type,
  }));
  
  const { error } = await supabase
    .from('notifications')
    .insert(notifications);
  
  if (error) throw error;
};

// Storage APIs
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
    });
  
  if (error) throw error;
  
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);
  
  return urlData.publicUrl;
};

export const deleteFile = async (bucket: string, path: string): Promise<void> => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  
  if (error) throw error;
};

// Schedule APIs

// Get schedules for current user (employee view)
export const getMySchedules = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<Schedule[]> => {
  const { data, error } = await supabase
    .from('cs_schedules')
    .select('*')
    .eq('user_id', userId)
    .gte('shift_date', startDate)
    .lte('shift_date', endDate)
    .order('shift_date', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Get schedules for a specific user (admin view)
export const getSchedulesByUser = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<Schedule[]> => {
  const { data, error } = await supabase
    .from('cs_schedules')
    .select('*')
    .eq('user_id', userId)
    .gte('shift_date', startDate)
    .lte('shift_date', endDate)
    .order('shift_date', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Get all schedules with employee details (admin bulk view)
export const getAllSchedules = async (
  startDate: string,
  endDate: string
): Promise<ScheduleWithEmployee[]> => {
  const { data, error } = await supabase
    .from('cs_schedules')
    .select(`
      *,
      employee:profiles!cs_schedules_user_id_fkey(*)
    `)
    .gte('shift_date', startDate)
    .lte('shift_date', endDate)
    .order('shift_date', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Get schedules for a specific week
export const getSchedulesByWeek = async (weekStart: Date): Promise<Schedule[]> => {
  const startDate = format(weekStart, 'yyyy-MM-dd');
  const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');
  
  const { data, error } = await supabase
    .from('cs_schedules')
    .select('*')
    .gte('shift_date', startDate)
    .lte('shift_date', endDate)
    .order('shift_date', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Get active employees (for admin dropdown)
export const getActiveEmployees = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .rpc('get_active_employees');
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Create a new schedule
export const createSchedule = async (schedule: {
  user_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: ShiftStatus;
  notes?: string;
  tasks?: string[];
  created_by: string;
}): Promise<Schedule> => {
  const { data, error } = await supabase
    .from('cs_schedules')
    .insert(schedule)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Update a schedule
export const updateSchedule = async (
  id: string,
  updates: Partial<Schedule>
): Promise<Schedule> => {
  const { data, error } = await supabase
    .from('cs_schedules')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Delete a schedule
export const deleteSchedule = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('cs_schedules')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Copy a week's schedule to another week
export const copyWeekSchedule = async (
  userId: string,
  fromDate: string,
  toDate: string
): Promise<void> => {
  const { error } = await supabase
    .rpc('copy_week_schedule', {
      p_user_id: userId,
      p_from_date: fromDate,
      p_to_date: toDate,
    });
  
  if (error) throw error;
};

// Reset all schedules (admin only)
export const resetAllSchedules = async (): Promise<{ success: boolean; deleted_count: number; message: string }> => {
  const { data, error } = await supabase
    .rpc('reset_all_schedules');
  
  if (error) throw error;
  
  if (!data || !data.success) {
    throw new Error(data?.error || 'Failed to reset schedules');
  }
  
  return {
    success: data.success,
    deleted_count: data.deleted_count,
    message: data.message,
  };
};

// Helper function to calculate end time (start time + 9 hours)
export const calculateEndTime = (startTime: string): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHours = (hours + 9) % 24;
  return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// ============================================
// TASK ANALYTICS APIs
// ============================================

// Get task statistics for a date range
export const getTaskStatistics = async (
  startDate: string,
  endDate: string
): Promise<TaskStatistics[]> => {
  const { data, error } = await supabase
    .rpc('get_task_statistics', {
      p_start_date: startDate,
      p_end_date: endDate
    });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Get employee task load for a date range
export const getEmployeeTaskLoad = async (
  startDate: string,
  endDate: string
): Promise<EmployeeTaskLoad[]> => {
  const { data, error } = await supabase
    .rpc('get_employee_task_load', {
      p_start_date: startDate,
      p_end_date: endDate
    });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Get daily task distribution
export const getDailyTaskDistribution = async (
  startDate: string,
  endDate: string
): Promise<{ shift_date: string; task_name: string; assignment_count: number }[]> => {
  const { data, error } = await supabase
    .rpc('get_daily_task_distribution', {
      p_start_date: startDate,
      p_end_date: endDate
    });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// ============================================
// ANNUAL LEAVE MANAGEMENT APIs
// ============================================

// Get employee leave balance for a specific year
export const getLeaveBalance = async (userId: string, year: number): Promise<EmployeeLeaveBalance | null> => {
  const { data, error } = await supabase
    .from('employee_leave_balances')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

// Get or create leave balance for current year
export const getOrCreateLeaveBalance = async (userId: string, year: number): Promise<EmployeeLeaveBalance> => {
  let balance = await getLeaveBalance(userId, year);
  
  if (!balance) {
    const { data, error } = await supabase
      .from('employee_leave_balances')
      .insert({
        user_id: userId,
        year,
        base_days: 14,
        overtime_days: 0,
        used_days: 0,
      })
      .select()
      .maybeSingle();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create leave balance');
    balance = data;
  }
  
  return balance;
};

// Update overtime days for an employee
export const updateOvertimeDays = async (
  userId: string,
  year: number,
  overtimeDays: number
): Promise<EmployeeLeaveBalance | null> => {
  const { data, error } = await supabase
    .from('employee_leave_balances')
    .update({ overtime_days: overtimeDays })
    .eq('user_id', userId)
    .eq('year', year)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

// Check for leave conflicts
export const checkLeaveConflict = async (
  dates: string[],
  excludeRequestId?: string
): Promise<LeaveConflict[]> => {
  const { data, error } = await supabase
    .rpc('check_leave_conflict', {
      p_dates: dates,
      p_exclude_request_id: excludeRequestId || null,
    });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Submit a leave request
export const submitLeaveRequest = async (
  userId: string,
  dates: string[],
  reason?: string,
  leaveType: 'normal' | 'emergency' = 'normal'
): Promise<{ success: boolean; request_id?: string; error?: string; message?: string }> => {
  const { data, error } = await supabase
    .rpc('submit_leave_request', {
      p_user_id: userId,
      p_dates: dates,
      p_reason: reason || null,
      p_leave_type: leaveType,
    });
  
  if (error) throw error;
  return data as { success: boolean; request_id?: string; error?: string; message?: string };
};

// Get all leave requests for a user
export const getUserLeaveRequests = async (userId: string): Promise<LeaveRequestWithDetails[]> => {
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      employee:profiles!leave_requests_user_id_fkey(id, full_name, email, employee_id, position),
      approver:profiles!leave_requests_approver_id_fkey(id, full_name, email),
      leave_days(*)
    `)
    .eq('user_id', userId)
    .order('request_date', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Get all leave requests (for approvers/admins)
export const getAllLeaveRequests = async (status?: string): Promise<LeaveRequestWithDetails[]> => {
  let query = supabase
    .from('leave_requests')
    .select(`
      *,
      employee:profiles!leave_requests_user_id_fkey(id, full_name, email, employee_id, position, team),
      approver:profiles!leave_requests_approver_id_fkey(id, full_name, email),
      leave_days(*)
    `);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  query = query.order('request_date', { ascending: false });
  
  const { data, error } = await query;
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Get leave days for a specific date range (for calendar view)
export const getLeaveDaysInRange = async (
  startDate: string,
  endDate: string,
  status?: string
): Promise<LeaveDay[]> => {
  let query = supabase
    .from('leave_days')
    .select('*')
    .gte('leave_date', startDate)
    .lte('leave_date', endDate);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  query = query.order('leave_date', { ascending: true });
  
  const { data, error } = await query;
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Get all leave days with user details (for team calendar)
export const getLeaveDaysWithUsers = async (
  startDate: string,
  endDate: string,
  status?: string
): Promise<Array<LeaveDay & { user?: Profile }>> => {
  let query = supabase
    .from('leave_days')
    .select(`
      *,
      user:profiles(id, full_name, email, employee_id, position, team)
    `)
    .gte('leave_date', startDate)
    .lte('leave_date', endDate);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  query = query.order('leave_date', { ascending: true });
  
  const { data, error } = await query;
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Approve a leave request
export const approveLeaveRequest = async (
  requestId: string,
  approverId: string
): Promise<{ success: boolean; error?: string; message?: string }> => {
  const { data, error } = await supabase
    .rpc('approve_leave_request', {
      p_request_id: requestId,
      p_approver_id: approverId,
    });
  
  if (error) throw error;
  return data as { success: boolean; error?: string; message?: string };
};

// Reject a leave request
export const rejectLeaveRequest = async (
  requestId: string,
  approverId: string,
  rejectionReason: string
): Promise<{ success: boolean; error?: string; message?: string }> => {
  const { data, error } = await supabase
    .rpc('reject_leave_request', {
      p_request_id: requestId,
      p_approver_id: approverId,
      p_rejection_reason: rejectionReason,
    });
  
  if (error) throw error;
  return data as { success: boolean; error?: string; message?: string };
};

// Initialize leave balances for all active employees for a year
export const initializeLeaveBalancesForYear = async (year: number): Promise<number> => {
  const { data, error } = await supabase
    .rpc('initialize_leave_balances_for_year', {
      p_year: year,
    });
  
  if (error) throw error;
  return data as number;
};

// Get all leave balances (for admin dashboard)
export const getAllLeaveBalances = async (year: number): Promise<Array<EmployeeLeaveBalance & { user?: Profile }>> => {
  const { data, error } = await supabase
    .from('employee_leave_balances')
    .select(`
      *,
      user:profiles(id, full_name, email, employee_id, position, team, status)
    `)
    .eq('year', year)
    .order('user_id', { ascending: true });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Update employee leave balance (admin only)
export const updateEmployeeLeaveBalance = async (
  balanceId: string,
  baseDays: number,
  overtimeDays: number,
  emergencyDays: number,
  usedDays?: number,
  emergencyUsedDays?: number
): Promise<{ success: boolean; error?: string; message?: string }> => {
  const { data, error } = await supabase
    .rpc('update_employee_leave_balance', {
      p_balance_id: balanceId,
      p_base_days: baseDays,
      p_overtime_days: overtimeDays,
      p_emergency_days: emergencyDays,
      p_used_days: usedDays,
      p_emergency_used_days: emergencyUsedDays,
    });
  
  if (error) throw error;
  return data as { success: boolean; error?: string; message?: string };
};

// Cancel approved leave request (admin/approver only)
export const cancelApprovedLeaveRequest = async (
  requestId: string,
  cancelledBy: string,
  cancellationReason?: string
): Promise<{ success: boolean; error?: string; message?: string }> => {
  const { data, error } = await supabase
    .rpc('cancel_approved_leave_request', {
      p_request_id: requestId,
      p_cancelled_by: cancelledBy,
      p_cancellation_reason: cancellationReason,
    });
  
  if (error) throw error;
  return data as { success: boolean; error?: string; message?: string };
};

// Leave Cancellation Requests
export const requestLeaveCancellation = async (
  leaveRequestId: string,
  requestReason?: string
): Promise<{ success: boolean; error?: string; message?: string; cancellation_request_id?: string }> => {
  const { data, error } = await supabase
    .rpc('request_leave_cancellation', {
      p_leave_request_id: leaveRequestId,
      p_request_reason: requestReason,
    });
  
  if (error) throw error;
  return data as { success: boolean; error?: string; message?: string; cancellation_request_id?: string };
};

export const respondToCancellationRequest = async (
  cancellationRequestId: string,
  action: 'approve' | 'reject',
  adminResponse?: string
): Promise<{ success: boolean; error?: string; message?: string }> => {
  const { data, error } = await supabase
    .rpc('respond_to_cancellation_request', {
      p_cancellation_request_id: cancellationRequestId,
      p_action: action,
      p_admin_response: adminResponse,
    });
  
  if (error) throw error;
  return data as { success: boolean; error?: string; message?: string };
};

export const getPendingCancellationRequests = async (): Promise<LeaveCancellationRequestWithDetails[]> => {
  const { data, error } = await supabase
    .from('leave_cancellation_requests')
    .select(`
      *,
      leave_request:leave_requests!leave_cancellation_requests_leave_request_id_fkey(
        *,
        employee:profiles!leave_requests_user_id_fkey(*),
        leave_days(*)
      ),
      requester:profiles!leave_cancellation_requests_requested_by_fkey(*),
      responder:profiles!leave_cancellation_requests_responded_by_fkey(*)
    `)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getAllCancellationRequests = async (status?: CancellationRequestStatus): Promise<LeaveCancellationRequestWithDetails[]> => {
  let query = supabase
    .from('leave_cancellation_requests')
    .select(`
      *,
      leave_request:leave_requests!leave_cancellation_requests_leave_request_id_fkey(
        *,
        employee:profiles!leave_requests_user_id_fkey(*),
        leave_days(*)
      ),
      requester:profiles!leave_cancellation_requests_requested_by_fkey(*),
      responder:profiles!leave_cancellation_requests_responded_by_fkey(*)
    `)
    .order('requested_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getMyCancellationRequests = async (): Promise<LeaveCancellationRequestWithDetails[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('leave_cancellation_requests')
    .select(`
      *,
      leave_request:leave_requests!leave_cancellation_requests_leave_request_id_fkey(
        *,
        leave_days(*)
      ),
      responder:profiles!leave_cancellation_requests_responded_by_fkey(*)
    `)
    .eq('requested_by', user.id)
    .order('requested_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// ============================================
// FILES HUB APIs
// ============================================

export const uploadCSFile = async (
  file: File,
  category: FileCategory,
  tags?: string
): Promise<CSFile> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  const fileName = file.name;
  const fileType: FileType = ['xls', 'xlsx', 'csv'].includes(fileExt) ? 'excel' : 'pdf';
  
  const filePath = `${user.id}/${Date.now()}_${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('cs_files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('cs_files')
    .insert({
      file_name: fileName,
      file_type: fileType,
      file_extension: fileExt,
      file_size: file.size,
      file_path: filePath,
      file_url: null,
      category,
      tags: tags || null,
      uploaded_by: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getCSFiles = async (filters?: Partial<FileFilters>): Promise<CSFileWithUploader[]> => {
  let query = supabase
    .from('cs_files')
    .select(`
      *,
      uploader:profiles!cs_files_uploaded_by_fkey(*)
    `);

  if (filters?.category && filters.category !== 'All') {
    query = query.eq('category', filters.category);
  }

  if (filters?.fileType && filters.fileType !== 'all') {
    query = query.eq('file_type', filters.fileType);
  }

  if (filters?.search) {
    query = query.or(`file_name.ilike.%${filters.search}%,tags.ilike.%${filters.search}%`);
  }

  const sortBy = filters?.sortBy || 'newest';
  switch (sortBy) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'name_asc':
      query = query.order('file_name', { ascending: true });
      break;
    case 'name_desc':
      query = query.order('file_name', { ascending: false });
      break;
    case 'size_asc':
      query = query.order('file_size', { ascending: true });
      break;
    case 'size_desc':
      query = query.order('file_size', { ascending: false });
      break;
  }

  const { data, error } = await query;

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getCSFileById = async (fileId: string): Promise<CSFileWithUploader | null> => {
  const { data, error } = await supabase
    .from('cs_files')
    .select(`
      *,
      uploader:profiles!cs_files_uploaded_by_fkey(*)
    `)
    .eq('id', fileId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateCSFile = async (
  fileId: string,
  updates: { file_name?: string; category?: FileCategory; tags?: string }
): Promise<CSFile> => {
  const { data, error } = await supabase
    .from('cs_files')
    .update(updates)
    .eq('id', fileId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCSFile = async (fileId: string): Promise<void> => {
  const file = await getCSFileById(fileId);
  if (!file) throw new Error('File not found');

  const { error: storageError } = await supabase.storage
    .from('cs_files')
    .remove([file.file_path]);

  if (storageError) throw storageError;

  const { error } = await supabase
    .from('cs_files')
    .delete()
    .eq('id', fileId);

  if (error) throw error;
};

export const getCSFileDownloadUrl = async (filePath: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from('cs_files')
    .createSignedUrl(filePath, 3600);

  if (error) throw error;
  return data.signedUrl;
};

export const downloadCSFile = async (filePath: string, fileName: string): Promise<void> => {
  const { data, error } = await supabase.storage
    .from('cs_files')
    .download(filePath);

  if (error) throw error;

  // Create a blob URL and trigger download
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// ============================================
// FOOD POISONING CASE APIs
// ============================================

export const createFoodPoisoningCase = async (
  caseData: Omit<FoodPoisoningCase, 'id' | 'case_number' | 'created_at' | 'updated_at' | 'pdf_generated_languages'>
): Promise<FoodPoisoningCase> => {
  const { data, error } = await supabase
    .from('food_poisoning_cases')
    .insert([caseData])
    .select()
    .maybeSingle();
  
  if (error) throw error;
  if (!data) throw new Error('Failed to create food poisoning case');
  return data;
};

export const getFoodPoisoningCases = async (): Promise<FoodPoisoningCaseWithCreator[]> => {
  const { data, error } = await supabase
    .from('food_poisoning_cases')
    .select(`
      *,
      creator:profiles!food_poisoning_cases_created_by_fkey(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getFoodPoisoningCaseById = async (id: string): Promise<FoodPoisoningCaseWithCreator | null> => {
  const { data, error } = await supabase
    .from('food_poisoning_cases')
    .select(`
      *,
      creator:profiles!food_poisoning_cases_created_by_fkey(*)
    `)
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const updateFoodPoisoningCase = async (
  id: string,
  updates: Partial<FoodPoisoningCase>
): Promise<FoodPoisoningCase> => {
  const { data, error } = await supabase
    .from('food_poisoning_cases')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  
  if (error) throw error;
  if (!data) throw new Error('Failed to update food poisoning case');
  return data;
};

export const deleteFoodPoisoningCase = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('food_poisoning_cases')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const updateCasePdfLanguages = async (
  id: string,
  language: 'english' | 'arabic'
): Promise<void> => {
  const { data: currentCase } = await supabase
    .from('food_poisoning_cases')
    .select('pdf_generated_languages')
    .eq('id', id)
    .maybeSingle();
  
  if (!currentCase) return;
  
  const languages = currentCase.pdf_generated_languages || [];
  if (!languages.includes(language)) {
    languages.push(language);
    
    await supabase
      .from('food_poisoning_cases')
      .update({ pdf_generated_languages: languages })
      .eq('id', id);
  }
};

// ============================================================================
// Shift Handover Notes API
// ============================================================================

/**
 * Get all shift handover notes with creator information
 * Ordered by creation date (newest first)
 */
export const getShiftHandoverNotes = async () => {
  const { data, error } = await supabase
    .from('shift_handover_notes')
    .select(`
      *,
      creator:profiles!shift_handover_notes_created_by_fkey(
        id,
        full_name,
        profile_image_url,
        position
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching shift handover notes:', error);
    throw error;
  }

  return Array.isArray(data) ? data : [];
};

/**
 * Get a single shift handover note by ID
 */
export const getShiftHandoverNoteById = async (id: string) => {
  const { data, error } = await supabase
    .from('shift_handover_notes')
    .select(`
      *,
      creator:profiles!shift_handover_notes_created_by_fkey(
        id,
        full_name,
        profile_image_url,
        position
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching shift handover note:', error);
    throw error;
  }

  return data;
};

/**
 * Get recent shift handover notes (last 24 hours)
 */
export const getRecentShiftHandoverNotes = async (limit: number = 3) => {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const { data, error } = await supabase
    .from('shift_handover_notes')
    .select(`
      *,
      creator:profiles!shift_handover_notes_created_by_fkey(
        id,
        full_name,
        profile_image_url,
        position
      )
    `)
    .gte('created_at', twentyFourHoursAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent shift handover notes:', error);
    throw error;
  }

  return Array.isArray(data) ? data : [];
};

/**
 * Create a new shift handover note
 * Automatically triggers notifications to all active users
 */
export const createShiftHandoverNote = async (note: {
  title: string;
  content: string;
  shift_type: string;
  priority?: string;
  follow_up_required?: boolean;
  tags?: string[];
  images?: string[];
  team?: string;
  time_range_start?: string;
  time_range_end?: string;
  related_ticket_link?: string;
  is_draft?: boolean;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('shift_handover_notes')
    .insert({
      ...note,
      created_by: user.id,
      priority: note.priority || 'normal',
      follow_up_required: note.follow_up_required || false,
      tags: note.tags || [],
      images: note.images || [],
      is_draft: note.is_draft || false,
      is_pinned: false,
      is_resolved: false
    })
    .select(`
      *,
      creator:profiles!shift_handover_notes_created_by_fkey(
        id,
        full_name,
        profile_image_url,
        position
      )
    `)
    .maybeSingle();

  if (error) {
    console.error('Error creating shift handover note:', error);
    throw error;
  }

  return data;
};

/**
 * Update an existing shift handover note
 * Only the creator can update their own notes
 */
export const updateShiftHandoverNote = async (
  id: string,
  updates: {
    title?: string;
    content?: string;
    shift_type?: string;
    priority?: string;
    follow_up_required?: boolean;
    tags?: string[];
    images?: string[];
    team?: string;
    time_range_start?: string;
    time_range_end?: string;
    related_ticket_link?: string;
    is_draft?: boolean;
    is_pinned?: boolean;
    is_resolved?: boolean;
  }
) => {
  const { data, error } = await supabase
    .from('shift_handover_notes')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      creator:profiles!shift_handover_notes_created_by_fkey(
        id,
        full_name,
        profile_image_url,
        position
      )
    `)
    .maybeSingle();

  if (error) {
    console.error('Error updating shift handover note:', error);
    throw error;
  }

  return data;
};

/**
 * Delete a shift handover note
 * Only admins can delete notes
 */
export const deleteShiftHandoverNote = async (id: string) => {
  const { error } = await supabase
    .from('shift_handover_notes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting shift handover note:', error);
    throw error;
  }
};

/**
 * Check if a shift handover note is new (less than 24 hours old)
 */
export const isShiftNoteNew = (createdAt: string): boolean => {
  const noteDate = new Date(createdAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - noteDate.getTime()) / (1000 * 60 * 60);
  return hoursDiff < 24;
};

/**
 * Upload an image to shift handover storage
 * Returns the public URL of the uploaded image
 */
export const uploadShiftHandoverImage = async (file: File): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('shift_handover_images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading image:', error);
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('shift_handover_images')
    .getPublicUrl(data.path);

  return publicUrl;
};

/**
 * Delete an image from shift handover storage
 */
export const deleteShiftHandoverImage = async (imageUrl: string): Promise<void> => {
  // Extract path from URL
  const urlParts = imageUrl.split('/shift_handover_images/');
  if (urlParts.length < 2) {
    throw new Error('Invalid image URL');
  }
  
  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('shift_handover_images')
    .remove([filePath]);

  if (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// ============================================
// BLACKLIST CUSTOMERS API
// ============================================

/**
 * Get all blacklist customers with optional filters
 */
export const getAllBlacklistCustomers = async (filters?: {
  search?: string;
  riskLevel?: string;
  status?: string;
  fraudType?: string;
}) => {
  let query = supabase
    .from('blacklist_customers')
    .select('*, creator:profiles!blacklist_customers_created_by_fkey(id, full_name, email)')
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.search) {
    query = query.or(`customer_name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
  }

  if (filters?.riskLevel && filters.riskLevel !== 'all') {
    query = query.eq('risk_level', filters.riskLevel);
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.fraudType && filters.fraudType !== 'all') {
    query = query.contains('fraud_types', [filters.fraudType]);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching blacklist customers:', error);
    throw error;
  }

  return Array.isArray(data) ? data : [];
};

/**
 * Get a single blacklist customer by ID
 */
export const getBlacklistCustomerById = async (id: string) => {
  const { data, error } = await supabase
    .from('blacklist_customers')
    .select('*, creator:profiles!blacklist_customers_created_by_fkey(id, full_name, email), updater:profiles!blacklist_customers_updated_by_fkey(id, full_name, email)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching blacklist customer:', error);
    throw error;
  }

  return data;
};

/**
 * Create a new blacklist customer entry
 */
export const createBlacklistCustomer = async (customerData: {
  customer_name?: string;
  phone_number?: string;
  email?: string;
  zoho_contact_id?: string;
  branch?: string;
  city?: string;
  fraud_types: string[];
  description_en?: string;
  description_ar?: string;
  zoho_ticket_ids?: string[];
  order_ids?: string[];
  attachment_links?: string[];
  risk_level: string;
  status?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('blacklist_customers')
    .insert({
      ...customerData,
      created_by: user.id,
      updated_by: user.id
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating blacklist customer:', error);
    throw error;
  }

  return data;
};

/**
 * Update a blacklist customer entry
 */
export const updateBlacklistCustomer = async (id: string, customerData: Partial<{
  customer_name?: string;
  phone_number?: string;
  email?: string;
  zoho_contact_id?: string;
  branch?: string;
  city?: string;
  fraud_types: string[];
  description_en?: string;
  description_ar?: string;
  zoho_ticket_ids?: string[];
  order_ids?: string[];
  attachment_links?: string[];
  risk_level: string;
  status?: string;
}>) => {
  const { data, error } = await supabase
    .from('blacklist_customers')
    .update(customerData)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating blacklist customer:', error);
    throw error;
  }

  return data;
};

/**
 * Archive a blacklist customer (soft delete by changing status to 'cleared')
 */
export const archiveBlacklistCustomer = async (id: string) => {
  return updateBlacklistCustomer(id, { status: 'cleared' });
};

/**
 * Delete a blacklist customer (hard delete - only for admins)
 */
export const deleteBlacklistCustomer = async (id: string) => {
  const { error } = await supabase
    .from('blacklist_customers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting blacklist customer:', error);
    throw error;
  }
};

/**
 * Get blacklist statistics
 */
export const getBlacklistStats = async () => {
  const { data, error } = await supabase
    .from('blacklist_customers')
    .select('id, risk_level, status, created_at');

  if (error) {
    console.error('Error fetching blacklist stats:', error);
    throw error;
  }

  const customers = Array.isArray(data) ? data : [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    total: customers.filter(c => c.status === 'active').length,
    highRisk: customers.filter(c => c.risk_level === 'high' && c.status === 'active').length,
    recentlyAdded: customers.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length
  };
};

/**
 * Check if current user can manage blacklist
 */
// التحقق من صلاحية إضافة إدخالات القائمة السوداء
// جميع الموظفين النشطين يمكنهم إضافة إدخالات
export const canManageBlacklist = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) return false;

  // جميع المستخدمين النشطين يمكنهم إضافة إدخالات القائمة السوداء
  return data.status === 'active';
};

// Upload evidence file for blacklist entry
export const uploadBlacklistEvidence = async (
  blacklistId: string,
  file: File
): Promise<{ url: string; path: string }> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${blacklistId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('app-7tw4zia1j9j5_blacklist_evidence')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('app-7tw4zia1j9j5_blacklist_evidence')
    .getPublicUrl(filePath);

  return { url: urlData.publicUrl, path: filePath };
};

// Delete evidence file
export const deleteBlacklistEvidence = async (filePath: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('app-7tw4zia1j9j5_blacklist_evidence')
    .remove([filePath]);

  if (error) throw error;
};

// Get signed URL for private file
export const getBlacklistEvidenceUrl = async (filePath: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from('app-7tw4zia1j9j5_blacklist_evidence')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) throw error;
  return data.signedUrl;
};

// ============================================
// BRANCH DIRECTORY APIs
// ============================================

export interface BranchFilters {
  search?: string;
  city?: string;
  status?: BranchStatus | 'all';
  hasDriveThru?: boolean | 'all';
  isFranchise?: boolean | 'all';
  is24Hours?: boolean | 'all';
}

// Get all branches with optional filters
export const getBranches = async (filters?: BranchFilters): Promise<Branch[]> => {
  let query = supabase
    .from('branches')
    .select(`
      *,
      images:branch_images(*)
    `);

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.or(`branch_code.ilike.${searchTerm},branch_name.ilike.${searchTerm},city.ilike.${searchTerm}`);
  }

  if (filters?.city && filters.city !== 'all') {
    query = query.eq('city', filters.city);
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.hasDriveThru !== undefined && filters.hasDriveThru !== 'all') {
    query = query.eq('has_drive_thru', filters.hasDriveThru);
  }

  if (filters?.isFranchise !== undefined && filters.isFranchise !== 'all') {
    query = query.eq('is_franchise', filters.isFranchise);
  }

  if (filters?.is24Hours !== undefined && filters.is24Hours !== 'all') {
    query = query.eq('is_24_hours', filters.is24Hours);
  }

  const { data, error } = await query;

  if (error) throw error;
  
  // Sort branches by numeric value extracted from branch_code
  const branches = Array.isArray(data) ? data : [];
  return branches.sort((a, b) => {
    // Extract numeric part from branch_code (handles formats like "JED-238", "10", "RYD-018")
    const getNumericValue = (code: string): number => {
      const match = code.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };
    
    const numA = getNumericValue(a.branch_code);
    const numB = getNumericValue(b.branch_code);
    
    return numA - numB;
  });
};

// Get single branch by ID
export const getBranchById = async (id: string): Promise<Branch | null> => {
  const { data, error } = await supabase
    .from('branches')
    .select(`
      *,
      images:branch_images(*)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// Get unique cities for filter dropdown
export const getBranchCities = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('branches')
    .select('city')
    .order('city', { ascending: true });

  if (error) throw error;
  
  const cities = Array.isArray(data) ? data.map(b => b.city).filter(city => city && city.trim() !== '') : [];
  return [...new Set(cities)];
};

// Create new branch
export const createBranch = async (branch: Omit<Branch, 'id' | 'created_at' | 'updated_at'>): Promise<Branch> => {
  const { data, error } = await supabase
    .from('branches')
    .insert([branch])
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Failed to create branch');
  return data;
};

// Update branch
export const updateBranch = async (id: string, updates: Partial<Omit<Branch, 'id' | 'created_at' | 'updated_at'>>): Promise<Branch> => {
  const { data, error } = await supabase
    .from('branches')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Failed to update branch');
  return data;
};

// Delete branch
export const deleteBranch = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('branches')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ============================================
// BRANCH IMAGES API
// ============================================

// Add images to a branch
export const addBranchImages = async (branchId: string, imageUrls: string[]): Promise<void> => {
  const images = imageUrls.map((url, index) => ({
    branch_id: branchId,
    image_url: url,
    display_order: index,
    is_primary: index === 0
  }));

  const { error } = await supabase
    .from('branch_images')
    .insert(images);

  if (error) throw error;
};

// Delete a branch image
export const deleteBranchImage = async (imageId: string): Promise<void> => {
  const { error } = await supabase
    .from('branch_images')
    .delete()
    .eq('id', imageId);

  if (error) throw error;
};

// Delete branch images by URLs
export const deleteBranchImagesByUrls = async (branchId: string, imageUrls: string[]): Promise<void> => {
  if (imageUrls.length === 0) return;
  
  const { error } = await supabase
    .from('branch_images')
    .delete()
    .eq('branch_id', branchId)
    .in('image_url', imageUrls);

  if (error) throw error;
};

// Update branch image order
export const updateBranchImageOrder = async (imageId: string, displayOrder: number): Promise<void> => {
  const { error } = await supabase
    .from('branch_images')
    .update({ display_order: displayOrder })
    .eq('id', imageId);

  if (error) throw error;
};

// Set primary image for branch
export const setBranchPrimaryImage = async (branchId: string, imageId: string): Promise<void> => {
  const { error } = await supabase
    .from('branch_images')
    .update({ is_primary: true })
    .eq('id', imageId)
    .eq('branch_id', branchId);

  if (error) throw error;
};

// Check if user has write permission for branches
export const canManageBranches = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return false;
  return ['admin', 'quality', 'team_leader'].includes(data.role);
};

export const getAllCannedResponses = async (filters?: {
  platform?: string;
  category?: string;
  language?: string;
  tone?: string;
  sentiment?: string;
  search?: string;
}) => {
  let query = supabase
    .from('social_canned_responses')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (filters?.platform && filters.platform !== 'all') {
    query = query.eq('platform', filters.platform);
  }

  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }

  if (filters?.language && filters.language !== 'all') {
    query = query.eq('language', filters.language);
  }

  if (filters?.tone && filters.tone !== 'all') {
    query = query.eq('tone', filters.tone);
  }

  if (filters?.sentiment && filters.sentiment !== 'all') {
    query = query.eq('sentiment', filters.sentiment);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,reply_ar.ilike.%${filters.search}%,reply_en.ilike.%${filters.search}%,tags.cs.{${filters.search}}`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getCannedResponseById = async (id: string) => {
  const { data, error } = await supabase
    .from('social_canned_responses')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getUniqueCategories = async () => {
  const { data, error } = await supabase
    .from('social_canned_responses')
    .select('category')
    .eq('is_active', true);

  if (error) throw error;
  const categories = Array.isArray(data) ? data : [];
  return [...new Set(categories.map(item => item.category).filter(cat => cat && cat.trim() !== ''))].sort();
};

export const createCannedResponse = async (response: {
  title: string;
  platform: string;
  category: string;
  language: string;
  tone: string;
  sentiment: string;
  tags: string[];
  reply_ar: string;
  reply_en?: string | null;
}) => {
  const { data, error } = await supabase
    .from('social_canned_responses')
    .insert([response])
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const updateCannedResponse = async (
  id: string,
  updates: {
    title?: string;
    platform?: string;
    category?: string;
    language?: string;
    tone?: string;
    sentiment?: string;
    tags?: string[];
    reply_ar?: string;
    reply_en?: string | null;
    is_active?: boolean;
  }
) => {
  const { data, error } = await supabase
    .from('social_canned_responses')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const deleteCannedResponse = async (id: string) => {
  const { error } = await supabase
    .from('social_canned_responses')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const canManageCannedResponses = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return false;
  return ['admin', 'writer', 'quality'].includes(data.role) && data.status === 'active';
};

// Customer Blacklist APIs
export const getBlacklistEntries = async (statusFilter?: CustomerBlacklistStatus): Promise<CustomerBlacklist[]> => {
  let query = supabase
    .from('customer_blacklist')
    .select('*')
    .order('date_blacklisted', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const searchBlacklistByPhone = async (phoneNumber: string): Promise<CustomerBlacklist | null> => {
  const { data, error } = await supabase
    .from('customer_blacklist')
    .select('*')
    .eq('phone_number', phoneNumber)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const addToBlacklist = async (entry: {
  phone_number: string;
  customer_name?: string;
  reason: string;
  date_blacklisted?: string;
  reported_by_id: string;
  reported_by_name: string;
}): Promise<CustomerBlacklist> => {
  const { data, error } = await supabase
    .from('customer_blacklist')
    .insert({
      phone_number: entry.phone_number,
      customer_name: entry.customer_name || null,
      reason: entry.reason,
      date_blacklisted: entry.date_blacklisted || new Date().toISOString().split('T')[0],
      reported_by_id: entry.reported_by_id,
      reported_by_name: entry.reported_by_name,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateBlacklistEntry = async (
  id: string,
  updates: Partial<CustomerBlacklist>
): Promise<CustomerBlacklist> => {
  const { data, error } = await supabase
    .from('customer_blacklist')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const removeFromBlacklist = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('customer_blacklist')
    .update({ status: 'removed' })
    .eq('id', id);

  if (error) throw error;
};

export const deleteBlacklistEntry = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('customer_blacklist')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getCustomerBlacklistStats = async () => {
  const { data, error } = await supabase
    .from('customer_blacklist')
    .select('status');

  if (error) throw error;

  const stats = {
    total: data?.length || 0,
    active: data?.filter(item => item.status === 'active').length || 0,
    removed: data?.filter(item => item.status === 'removed').length || 0,
  };

  return stats;
};

// ============================================
// CASE NOTES APIs
// ============================================

export const getAllCaseNotes = async (): Promise<CaseNote[]> => {
  const { data, error } = await supabase
    .from('case_notes')
    .select(`
      *,
      creator:profiles!case_notes_created_by_fkey(id, full_name, email, profile_image_url),
      updater:profiles!case_notes_updated_by_fkey(id, full_name, email, profile_image_url)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getCaseNoteById = async (id: string): Promise<CaseNote | null> => {
  const { data, error } = await supabase
    .from('case_notes')
    .select(`
      *,
      creator:profiles!case_notes_created_by_fkey(id, full_name, email, profile_image_url, role),
      updater:profiles!case_notes_updated_by_fkey(id, full_name, email, profile_image_url, role)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getCaseNotesByPhone = async (phone: string): Promise<CaseNote[]> => {
  const { data, error } = await supabase
    .from('case_notes')
    .select(`
      *,
      creator:profiles!case_notes_created_by_fkey(id, full_name, email, profile_image_url)
    `)
    .eq('customer_phone', phone)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createCaseNote = async (caseData: {
  customer_phone: string;
  customer_name?: string;
  issue_category: string;
  description: string;
  action_taken: string;
  status: CaseStatus;
  attachments?: string[];
}): Promise<CaseNote> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('case_notes')
    .insert({
      ...caseData,
      created_by: user.id,
      attachments: caseData.attachments || [],
    })
    .select(`
      *,
      creator:profiles!case_notes_created_by_fkey(id, full_name, email, profile_image_url)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const updateCaseNote = async (
  id: string,
  updates: Partial<{
    customer_phone: string;
    customer_name: string;
    issue_category: string;
    description: string;
    action_taken: string;
    status: CaseStatus;
    attachments: string[];
  }>
): Promise<CaseNote> => {
  const { data, error } = await supabase
    .from('case_notes')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      creator:profiles!case_notes_created_by_fkey(id, full_name, email, profile_image_url),
      updater:profiles!case_notes_updated_by_fkey(id, full_name, email, profile_image_url)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const deleteCaseNote = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('case_notes')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getCaseNoteUpdates = async (caseId: string): Promise<CaseNoteUpdate[]> => {
  const { data, error } = await supabase
    .from('case_note_updates')
    .select(`
      *,
      updater:profiles!case_note_updates_updated_by_fkey(id, full_name, email, profile_image_url, role)
    `)
    .eq('case_id', caseId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const addCaseNoteUpdate = async (
  caseId: string,
  updateText: string
): Promise<CaseNoteUpdate> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('case_note_updates')
    .insert({
      case_id: caseId,
      update_text: updateText,
      updated_by: user.id,
    })
    .select(`
      *,
      updater:profiles!case_note_updates_updated_by_fkey(id, full_name, email, profile_image_url, role)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const getCaseStatistics = async (): Promise<CaseStatistics> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .rpc('get_case_statistics', { uid: user.id });

  if (error) throw error;
  
  return data?.[0] || {
    total_cases: 0,
    open_cases: 0,
    pending_tl_cases: 0,
    escalated_cases: 0,
    closed_cases: 0,
    cases_today: 0,
    my_cases: 0,
  };
};

export const searchCaseNotes = async (filters: {
  search?: string;
  status?: CaseStatus | 'all';
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  createdBy?: string;
}): Promise<CaseNote[]> => {
  let query = supabase
    .from('case_notes')
    .select(`
      *,
      creator:profiles!case_notes_created_by_fkey(id, full_name, email, profile_image_url),
      updater:profiles!case_notes_updated_by_fkey(id, full_name, email, profile_image_url)
    `);

  if (filters.search) {
    query = query.or(`customer_phone.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.category) {
    query = query.eq('issue_category', filters.category);
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  if (filters.createdBy) {
    query = query.eq('created_by', filters.createdBy);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const canViewAllCases = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .rpc('can_view_all_cases', { uid: userId });

  if (error) throw error;
  return data || false;
};

export const canManageCases = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .rpc('can_manage_cases', { uid: userId });

  if (error) throw error;
  return data || false;
};

export const getUniqueIssueCategories = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('case_notes')
    .select('issue_category')
    .order('issue_category', { ascending: true });

  if (error) throw error;
  
  const categories = Array.isArray(data) 
    ? [...new Set(data.map(item => item.issue_category).filter(cat => cat && cat.trim() !== ''))]
    : [];
  
  return categories;
};

// Get recent case notes for home page widget
export const getRecentCaseNotesForHome = async (): Promise<CaseNote[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .rpc('get_recent_case_notes_for_home', { uid: user.id });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// ============================================================================
// MENU ITEMS & NUTRITION
// ============================================================================

export const getAllMenuItems = async (): Promise<MenuItem[]> => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getMenuItemById = async (id: string): Promise<MenuItem | null> => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getFeaturedMenuItems = async (limit: number = 4): Promise<MenuItem[]> => {
  const { data, error } = await supabase
    .rpc('get_featured_menu_items', { limit_count: limit });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const searchMenuItems = async (query: string): Promise<MenuItem[]> => {
  const { data, error } = await supabase
    .rpc('search_menu_items', { search_query: query });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createMenuItem = async (menuItem: Partial<MenuItem>): Promise<MenuItem> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('menu_items')
    .insert({
      ...menuItem,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateMenuItem = async (id: string, updates: Partial<MenuItem>): Promise<MenuItem> => {
  const { data, error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const uploadMenuItemImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('menu_items')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('menu_items')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const uploadMenuItemVideo = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `video-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('menu_items')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('menu_items')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// ============================================
// Common Issues & Compensation API Functions
// ============================================

export const getAllCommonIssues = async (): Promise<CommonIssue[]> => {
  const { data, error } = await supabase
    .from('common_issues')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getCommonIssueById = async (id: string): Promise<CommonIssue | null> => {
  const { data, error } = await supabase
    .from('common_issues')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getFeaturedCommonIssues = async (limit: number = 5): Promise<CommonIssue[]> => {
  const { data, error } = await supabase
    .rpc('get_featured_common_issues', { limit_count: limit });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const searchCommonIssues = async (searchQuery: string): Promise<CommonIssue[]> => {
  if (!searchQuery || searchQuery.trim() === '') {
    return getAllCommonIssues();
  }

  const { data, error } = await supabase
    .rpc('search_common_issues', { search_query: searchQuery });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const filterCommonIssues = async (
  category?: string,
  compensationType?: string,
  escalationRequired?: boolean
): Promise<CommonIssue[]> => {
  let query = supabase
    .from('common_issues')
    .select('*')
    .eq('is_active', true);

  if (category && category !== 'all') {
    query = query.eq('issue_category', category);
  }

  if (compensationType && compensationType !== 'all') {
    query = query.eq('compensation_type', compensationType);
  }

  if (escalationRequired !== undefined) {
    query = query.eq('escalation_required', escalationRequired);
  }

  query = query
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createCommonIssue = async (issue: Partial<CommonIssue>): Promise<CommonIssue> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const issueData = {
    ...issue,
    created_by: user?.id,
    is_active: issue.is_active ?? true,
    is_featured: issue.is_featured ?? false,
    display_order: issue.display_order ?? 0,
    escalation_required: issue.escalation_required ?? false,
  };

  const { data, error } = await supabase
    .from('common_issues')
    .insert([issueData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCommonIssue = async (id: string, updates: Partial<CommonIssue>): Promise<CommonIssue> => {
  const { data, error } = await supabase
    .from('common_issues')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCommonIssue = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('common_issues')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const toggleCommonIssueActive = async (id: string, isActive: boolean): Promise<CommonIssue> => {
  return updateCommonIssue(id, { is_active: isActive });
};

export const toggleCommonIssueFeatured = async (id: string, isFeatured: boolean): Promise<CommonIssue> => {
  return updateCommonIssue(id, { is_featured: isFeatured });
};

// ============================================
// Promotions & Offers APIs
// ============================================

export const getAllPromotions = async (): Promise<Promotion[]> => {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getPromotionById = async (id: string): Promise<Promotion | null> => {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getFeaturedPromotions = async (limit: number = 3): Promise<Promotion[]> => {
  const { data, error } = await supabase
    .rpc('get_featured_promotions')
    .order('id', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getActivePromotions = async (): Promise<Promotion[]> => {
  const { data, error } = await supabase
    .rpc('get_active_promotions');

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const searchPromotions = async (searchQuery: string): Promise<Promotion[]> => {
  const { data, error } = await supabase
    .rpc('search_promotions', { search_query: searchQuery });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const filterPromotions = async (filters: {
  status?: string;
  type?: string;
  channel?: string;
}): Promise<Promotion[]> => {
  let query = supabase
    .from('promotions')
    .select('*');

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }

  if (filters.channel && filters.channel !== 'all') {
    query = query.contains('channels', [filters.channel]);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createPromotion = async (promotion: Partial<Promotion>): Promise<Promotion> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const promoData = {
    ...promotion,
    created_by: user?.id,
    highlight: promotion.highlight ?? false,
    current_usage_count: 0,
  };

  const { data, error } = await supabase
    .from('promotions')
    .insert([promoData])
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Failed to create promotion');
  return data;
};

export const updatePromotion = async (id: string, updates: Partial<Promotion>): Promise<Promotion> => {
  const { data, error } = await supabase
    .from('promotions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Failed to update promotion');
  return data;
};

export const deletePromotion = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const togglePromotionStatus = async (id: string, status: string): Promise<Promotion> => {
  return updatePromotion(id, { status: status as any });
};

export const togglePromotionHighlight = async (id: string, highlight: boolean): Promise<Promotion> => {
  return updatePromotion(id, { highlight });
};

export const duplicatePromotion = async (id: string): Promise<Promotion> => {
  const original = await getPromotionById(id);
  if (!original) throw new Error('Promotion not found');

  const { id: _, created_at, updated_at, created_by, current_usage_count, ...duplicateData } = original;

  return createPromotion({
    ...duplicateData,
    title_en: `${duplicateData.title_en} (Copy)`,
    title_ar: `${duplicateData.title_ar} (نسخة)`,
    promo_code: duplicateData.promo_code ? `${duplicateData.promo_code}_COPY` : null,
    status: 'scheduled' as any,
    highlight: false,
  });
};

// ============================================
// Break & Attendance API Functions
// ============================================

export const startBreak = async (breakType: BreakType, notes?: string) => {
  const { data, error } = await supabase.rpc('start_break', {
    p_break_type: breakType,
    p_notes: notes || null,
  });

  if (error) throw error;
  return data;
};

export const endBreak = async (breakId: string) => {
  const { data, error } = await supabase.rpc('end_break', {
    p_break_id: breakId,
  });

  if (error) throw error;
  return data;
};

export const forceEndBreak = async (breakId: string, justification: string) => {
  const { data: breakData, error: fetchError } = await supabase
    .from('breaks')
    .select('*')
    .eq('id', breakId)
    .single();

  if (fetchError) throw fetchError;

  const duration = (new Date().getTime() - new Date(breakData.start_time).getTime()) / 60000;

  const { error } = await supabase
    .from('breaks')
    .update({
      end_time: new Date().toISOString(),
      duration_minutes: duration,
      notes: `${breakData.notes || ''}\n\nJustification for exceeding 30 min: ${justification}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', breakId);

  if (error) throw error;

  return {
    success: true,
    duration,
    end_time: new Date().toISOString(),
  };
};

export const getMyBreaksToday = async (): Promise<MyBreaksToday> => {
  const { data, error } = await supabase.rpc('get_my_breaks_today');

  if (error) throw error;
  return data;
};

export const getDailyBreakReport = async (
  date?: string,
  userId?: string,
  team?: string
): Promise<DailyBreakReportRow[]> => {
  const { data, error } = await supabase.rpc('get_daily_break_report', {
    p_date: date || null,
    p_user_id: userId || null,
    p_team: team || null,
  });

  if (error) {
    console.error('getDailyBreakReport error:', error);
    throw new Error(error.message || 'Failed to fetch daily break report');
  }
  return Array.isArray(data) ? data : [];
};

export const getDetailedBreakReport = async (
  date?: string,
  userId?: string
): Promise<DetailedBreakReportRow[]> => {
  const { data, error } = await supabase.rpc('get_detailed_break_report', {
    p_date: date || null,
    p_user_id: userId || null,
  });

  if (error) {
    console.error('getDetailedBreakReport error:', error);
    throw new Error(error.message || 'Failed to fetch detailed break report');
  }
  return Array.isArray(data) ? data : [];
};

export const recordAttendanceSession = async (
  sessionStart: string,
  sessionEnd?: string
) => {
  const { data, error } = await supabase.rpc('record_attendance_session', {
    p_session_start: sessionStart,
    p_session_end: sessionEnd || null,
  });

  if (error) throw error;
  return data;
};

export const getActiveBreak = async (): Promise<Break | null> => {
  const { data, error } = await supabase
    .from('breaks')
    .select('*')
    .is('end_time', null)
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getAllBreaks = async (
  startDate?: string,
  endDate?: string
): Promise<Break[]> => {
  let query = supabase
    .from('breaks')
    .select('*')
    .order('start_time', { ascending: false });

  if (startDate) {
    query = query.gte('break_date', startDate);
  }

  if (endDate) {
    query = query.lte('break_date', endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getBreaksByUser = async (
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<Break[]> => {
  let query = supabase
    .from('breaks')
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: false });

  if (startDate) {
    query = query.gte('break_date', startDate);
  }

  if (endDate) {
    query = query.lte('break_date', endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getAttendanceSessions = async (
  startDate?: string,
  endDate?: string
): Promise<AttendanceSession[]> => {
  let query = supabase
    .from('attendance_sessions')
    .select('*')
    .order('session_start', { ascending: false });

  if (startDate) {
    query = query.gte('session_date', startDate);
  }

  if (endDate) {
    query = query.lte('session_date', endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const deleteBreak = async (breakId: string) => {
  const { error } = await supabase
    .from('breaks')
    .delete()
    .eq('id', breakId);

  if (error) throw error;
};

export const getLiveBreaks = async (): Promise<LiveBreakMonitor[]> => {
  const { data, error } = await supabase
    .from('breaks')
    .select(`
      id,
      user_id,
      break_type,
      start_time,
      notes,
      created_by,
      profiles!breaks_user_id_fkey (
        full_name,
        role,
        team,
        position,
        profile_image_url
      )
    `)
    .is('end_time', null)
    .order('start_time', { ascending: true });

  if (error) throw error;

  const now = new Date();
  const liveBreaks: LiveBreakMonitor[] = (data || []).map((breakItem: any) => {
    const startTime = new Date(breakItem.start_time);
    const durationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const allowedLimitMinutes = breakItem.break_type === 'meeting' ? 999 : 30;
    const isOvertime = durationSeconds > allowedLimitMinutes * 60;

    return {
      id: breakItem.id,
      user_id: breakItem.user_id,
      full_name: breakItem.profiles?.full_name || 'Unknown',
      role: breakItem.profiles?.role || 'employee',
      team: breakItem.profiles?.team || null,
      position: breakItem.profiles?.position || null,
      break_type: breakItem.break_type,
      start_time: breakItem.start_time,
      duration_seconds: durationSeconds,
      notes: breakItem.notes,
      allowed_limit_minutes: allowedLimitMinutes,
      is_overtime: isOvertime,
      created_by: breakItem.created_by,
      profile_image_url: breakItem.profiles?.profile_image_url || null,
    };
  });

  return liveBreaks;
};

export const getBreaksWithEmployees = async (
  startDate?: string,
  endDate?: string
): Promise<BreakWithEmployee[]> => {
  let query = supabase
    .from('breaks')
    .select(`
      *,
      profiles!breaks_user_id_fkey (*)
    `)
    .order('start_time', { ascending: false });

  if (startDate) {
    query = query.gte('break_date', startDate);
  }

  if (endDate) {
    query = query.lte('break_date', endDate);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map((item: any) => ({
    ...item,
    employee: item.profiles || undefined,
  }));
};

// ==================== Comprehensive Attendance Report Functions ====================

/**
 * جلب تقرير شامل للحضور والبريكات لتاريخ محدد
 * @param date - التاريخ المطلوب (YYYY-MM-DD)
 * @param userId - معرف المستخدم (اختياري - إذا كان فارغاً يجلب الكل)
 * @returns تقرير شامل لكل موظف
 */
export const getComprehensiveAttendanceReport = async (
  date: string,
  userId?: string
): Promise<any[]> => {
  try {
    // جلب جميع الموظفين النشطين
    let profilesQuery = supabase
      .from('profiles')
      .select('*')
      .eq('status', 'active');

    if (userId && userId !== 'all') {
      profilesQuery = profilesQuery.eq('id', userId);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;
    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // جلب جلسات الحضور للتاريخ المحدد
    const { data: attendanceSessions, error: attendanceError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('session_date', date)
      .order('session_start', { ascending: true });

    if (attendanceError) throw attendanceError;

    // جلب البريكات للتاريخ المحدد
    const { data: breaks, error: breaksError } = await supabase
      .from('breaks')
      .select('*')
      .eq('break_date', date)
      .order('start_time', { ascending: true });

    if (breaksError) throw breaksError;

    // بناء التقرير لكل موظف
    const report = profiles.map((profile: any) => {
      // جلسات الحضور للموظف
      const userSessions = (attendanceSessions || []).filter(
        (s: any) => s.user_id === profile.id
      );

      // البريكات للموظف
      const userBreaks = (breaks || []).filter(
        (b: any) => b.user_id === profile.id
      );

      // حساب إجمالي وقت العمل
      const totalWorkMinutes = userSessions.reduce((sum: number, session: any) => {
        if (session.session_end) {
          const start = new Date(session.session_start).getTime();
          const end = new Date(session.session_end).getTime();
          const minutes = Math.floor((end - start) / (1000 * 60));
          return sum + minutes;
        }
        return sum;
      }, 0);

      // حساب إجمالي وقت البريكات وتصنيفها حسب النوع
      let totalBreakMinutes = 0;
      let normalBreakMinutes = 0;
      let prayerBreakMinutes = 0;
      let technicalBreakMinutes = 0;
      let meetingBreakMinutes = 0;
      let breaksExceeding30min = 0;
      let longestBreakMinutes = 0;

      userBreaks.forEach((breakItem: any) => {
        if (breakItem.end_time) {
          const start = new Date(breakItem.start_time).getTime();
          const end = new Date(breakItem.end_time).getTime();
          const minutes = Math.floor((end - start) / (1000 * 60));

          totalBreakMinutes += minutes;

          // تصنيف حسب النوع
          switch (breakItem.break_type) {
            case 'normal':
              normalBreakMinutes += minutes;
              break;
            case 'prayer':
              prayerBreakMinutes += minutes;
              break;
            case 'technical':
              technicalBreakMinutes += minutes;
              break;
            case 'meeting':
              meetingBreakMinutes += minutes;
              break;
          }

          // التحقق من تجاوز 30 دقيقة
          if (minutes > 30) {
            breaksExceeding30min++;
          }

          // تحديث أطول بريك
          if (minutes > longestBreakMinutes) {
            longestBreakMinutes = minutes;
          }
        }
      });

      return {
        user_id: profile.id,
        full_name: profile.full_name,
        role: profile.role,
        team: profile.team,
        position: profile.position,
        scheduled_start: profile.scheduled_start,
        scheduled_end: profile.scheduled_end,
        first_login: userSessions.length > 0 ? userSessions[0].session_start : null,
        last_logout: userSessions.length > 0 && userSessions[userSessions.length - 1].session_end 
          ? userSessions[userSessions.length - 1].session_end 
          : null,
        late_login_minutes: 0, // يمكن حسابه لاحقاً بناءً على scheduled_start
        early_logout_minutes: 0, // يمكن حسابه لاحقاً بناءً على scheduled_end
        is_late_login: false,
        is_early_logout: false,
        online_time_minutes: totalWorkMinutes,
        total_break_minutes: totalBreakMinutes,
        normal_break_minutes: normalBreakMinutes,
        prayer_break_minutes: prayerBreakMinutes,
        technical_break_minutes: technicalBreakMinutes,
        meeting_break_minutes: meetingBreakMinutes,
        breaks_count: userBreaks.length,
        breaks_exceeding_30min: breaksExceeding30min,
        longest_break_minutes: longestBreakMinutes,
        attendance_sessions: userSessions.map((s: any, idx: number) => ({
          session_number: idx + 1,
          check_in_time: s.session_start,
          check_out_time: s.session_end,
          duration_minutes: s.session_end 
            ? Math.floor((new Date(s.session_end).getTime() - new Date(s.session_start).getTime()) / (1000 * 60))
            : 0,
        })),
        break_sessions: userBreaks.map((b: any, idx: number) => ({
          break_number: idx + 1,
          break_type: b.break_type,
          start_time: b.start_time,
          end_time: b.end_time,
          duration_minutes: b.end_time 
            ? Math.floor((new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / (1000 * 60))
            : 0,
          exceeds_limit: b.end_time 
            ? Math.floor((new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) / (1000 * 60)) > 30
            : false,
          notes: b.notes,
        })),
      };
    });

    return report;
  } catch (error) {
    console.error('خطأ في جلب التقرير الشامل:', error);
    throw error;
  }
};

// ============================================
// System Settings Functions
// ============================================

export const getSystemSettings = async (): Promise<SystemSettings | null> => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('خطأ في جلب إعدادات النظام:', error);
    throw error;
  }

  return data;
};

export const updateSystemSettings = async (
  settings: Partial<Omit<SystemSettings, 'id' | 'updated_at' | 'updated_by'>>
): Promise<SystemSettings> => {
  const { data, error } = await supabase
    .from('system_settings')
    .update(settings)
    .eq('id', 1)
    .select()
    .maybeSingle();

  if (error) {
    console.error('خطأ في تحديث إعدادات النظام:', error);
    throw error;
  }

  if (!data) {
    throw new Error('فشل تحديث إعدادات النظام');
  }

  return data;
};

// ============================================
// WARNINGS & ALERTS SYSTEM
// ============================================

export const createWarningWithNotification = async (params: {
  employee_id: string;
  type: string;
  severity: string;
  title: string;
  reason: string;
  incident_date: string;
  points: number;
  attachments?: any;
  related_module?: string;
  related_link?: string;
}): Promise<string> => {
  const { data, error } = await supabase.rpc('create_warning_with_notification', {
    p_employee_id: params.employee_id,
    p_type: params.type,
    p_severity: params.severity,
    p_title: params.title,
    p_reason: params.reason,
    p_incident_date: params.incident_date,
    p_points: params.points,
    p_attachments: params.attachments || null,
    p_related_module: params.related_module || null,
    p_related_link: params.related_link || null,
  });

  if (error) {
    console.error('Error creating warning:', error);
    // Create a more detailed error message
    const errorMsg = error.message || error.details || error.hint || 'Failed to create warning';
    throw new Error(errorMsg);
  }

  return data;
};

export const getEmployeeWarnings = async (employeeId?: string) => {
  let query = supabase
    .from('employee_warnings')
    .select(`
      *,
      issuer:issued_by(id, full_name, role, position),
      employee:employee_id(id, full_name, employee_id, position)
    `)
    .order('issued_at', { ascending: false });

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching warnings:', error);
    throw error;
  }

  return Array.isArray(data) ? data : [];
};

export const getWarningById = async (id: string) => {
  const { data, error } = await supabase
    .from('employee_warnings')
    .select(`
      *,
      issuer:issued_by(id, full_name, role, position),
      employee:employee_id(id, full_name, employee_id, position)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching warning:', error);
    throw error;
  }

  return data;
};

export const acknowledgeWarning = async (
  warningId: string,
  response?: string
) => {
  const updateData: any = {
    status: 'acknowledged',
    acknowledged_at: new Date().toISOString(),
  };

  if (response) {
    updateData.employee_response = response;
  }

  const { data, error } = await supabase
    .from('employee_warnings')
    .update(updateData)
    .eq('id', warningId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error acknowledging warning:', error);
    throw error;
  }

  return data;
};

export const updateWarningStatus = async (
  warningId: string,
  status: string
) => {
  const { data, error } = await supabase
    .from('employee_warnings')
    .update({ status })
    .eq('id', warningId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating warning status:', error);
    throw error;
  }

  return data;
};

export const getEmployeeWarningStats = async (employeeId: string) => {
  const { data, error } = await supabase.rpc('get_employee_warning_stats', {
    p_employee_id: employeeId,
  });

  if (error) {
    console.error('Error fetching warning stats:', error);
    throw error;
  }

  return data;
};

export const getWarningTemplates = async () => {
  const { data, error } = await supabase
    .from('warning_templates')
    .select('*')
    .order('type', { ascending: true })
    .order('points', { ascending: true });

  if (error) {
    console.error('Error fetching warning templates:', error);
    throw error;
  }

  return Array.isArray(data) ? data : [];
};

export const deleteWarning = async (warningId: string) => {
  const { error } = await supabase
    .from('employee_warnings')
    .delete()
    .eq('id', warningId);

  if (error) {
    console.error('Error deleting warning:', error);
    throw error;
  }
};

// ============================================
// DASHBOARD SYSTEM API
// ============================================

// Dashboard Management
export const getAllDashboards = async (): Promise<Dashboard[]> => {
  const { data, error } = await supabase
    .from('dashboards')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getUserDashboards = async (userId: string): Promise<DashboardWithWidgets[]> => {
  const { data, error } = await supabase
    .rpc('get_user_dashboards', { p_user_id: userId });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getDashboardById = async (dashboardId: string): Promise<Dashboard | null> => {
  const { data, error } = await supabase
    .from('dashboards')
    .select('*')
    .eq('id', dashboardId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const createDashboard = async (dashboard: Partial<Dashboard>): Promise<Dashboard> => {
  const { data, error } = await supabase
    .from('dashboards')
    .insert({
      name: dashboard.name || 'New Dashboard',
      description: dashboard.description || null,
      layout_type: dashboard.layout_type || 'grid',
      is_active: dashboard.is_active ?? true,
      display_order: dashboard.display_order || 0,
      created_by: dashboard.created_by,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateDashboard = async (dashboardId: string, updates: Partial<Dashboard>): Promise<Dashboard> => {
  const { data, error } = await supabase
    .from('dashboards')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dashboardId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteDashboard = async (dashboardId: string): Promise<void> => {
  const { error } = await supabase
    .from('dashboards')
    .delete()
    .eq('id', dashboardId);

  if (error) throw error;
};

// Widget Management
export const getDashboardWidgets = async (dashboardId: string): Promise<DashboardWidget[]> => {
  const { data, error } = await supabase
    .from('dashboard_widgets')
    .select('*')
    .eq('dashboard_id', dashboardId)
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const getWidgetById = async (widgetId: string): Promise<DashboardWidget | null> => {
  const { data, error } = await supabase
    .from('dashboard_widgets')
    .select('*')
    .eq('id', widgetId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const createWidget = async (widget: Partial<DashboardWidget>): Promise<DashboardWidget> => {
  const { data, error } = await supabase
    .from('dashboard_widgets')
    .insert({
      dashboard_id: widget.dashboard_id,
      widget_type: widget.widget_type || 'metric',
      title: widget.title || 'New Widget',
      config: widget.config || {},
      position_x: widget.position_x || 0,
      position_y: widget.position_y || 0,
      width: widget.width || 1,
      height: widget.height || 1,
      display_order: widget.display_order || 0,
      is_visible: widget.is_visible ?? true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateWidget = async (widgetId: string, updates: Partial<DashboardWidget>): Promise<DashboardWidget> => {
  const { data, error } = await supabase
    .from('dashboard_widgets')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', widgetId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteWidget = async (widgetId: string): Promise<void> => {
  const { error } = await supabase
    .from('dashboard_widgets')
    .delete()
    .eq('id', widgetId);

  if (error) throw error;
};

export const updateWidgetPositions = async (updates: Array<{ id: string; position_x: number; position_y: number; display_order: number }>): Promise<void> => {
  const promises = updates.map(update =>
    supabase
      .from('dashboard_widgets')
      .update({
        position_x: update.position_x,
        position_y: update.position_y,
        display_order: update.display_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', update.id)
  );

  const results = await Promise.all(promises);
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    throw errors[0].error;
  }
};

// Widget Types
export const getWidgetTypes = async (): Promise<WidgetTypeDefinition[]> => {
  const { data, error } = await supabase
    .from('widget_types')
    .select('*')
    .eq('is_active', true)
    .order('display_name', { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

// Dashboard Permissions
export const getDashboardPermissions = async (dashboardId: string): Promise<DashboardPermission[]> => {
  const { data, error } = await supabase
    .from('dashboard_permissions')
    .select('*')
    .eq('dashboard_id', dashboardId);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createDashboardPermission = async (permission: Partial<DashboardPermission>): Promise<DashboardPermission> => {
  const { data, error } = await supabase
    .from('dashboard_permissions')
    .insert({
      dashboard_id: permission.dashboard_id,
      user_id: permission.user_id || null,
      role: permission.role || null,
      can_view: permission.can_view ?? true,
      can_edit: permission.can_edit ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteDashboardPermission = async (permissionId: string): Promise<void> => {
  const { error } = await supabase
    .from('dashboard_permissions')
    .delete()
    .eq('id', permissionId);

  if (error) throw error;
};

// Task Types
export const getTaskTypes = async (): Promise<DashboardTaskType[]> => {
  const { data, error } = await supabase
    .from('task_types')
    .select('*')
    .eq('is_active', true)
    .order('display_name', { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createTaskType = async (taskType: Partial<DashboardTaskType>): Promise<DashboardTaskType> => {
  const { data, error } = await supabase
    .from('task_types')
    .insert({
      name: taskType.name,
      display_name: taskType.display_name || taskType.name,
      icon: taskType.icon || null,
      color: taskType.color || null,
      is_active: taskType.is_active ?? true,
      created_by: taskType.created_by,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTaskType = async (taskTypeId: string, updates: Partial<DashboardTaskType>): Promise<DashboardTaskType> => {
  const { data, error} = await supabase
    .from('task_types')
    .update(updates)
    .eq('id', taskTypeId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTaskType = async (taskTypeId: string): Promise<void> => {
  const { error } = await supabase
    .from('task_types')
    .delete()
    .eq('id', taskTypeId);

  if (error) throw error;
};

// Dashboard Tasks
export const getDashboardTasks = async (filters?: {
  assigned_to?: string;
  status?: DashboardTaskStatus;
  task_type_id?: string;
}): Promise<DashboardTaskWithDetails[]> => {
  let query = supabase
    .from('dashboard_tasks')
    .select(`
      *,
      task_type:task_types(*),
      assigned_user:profiles!dashboard_tasks_assigned_to_fkey(*),
      created_by_user:profiles!dashboard_tasks_created_by_fkey(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.task_type_id) {
    query = query.eq('task_type_id', filters.task_type_id);
  }

  const { data, error } = await query;

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const createDashboardTask = async (task: Partial<DashboardTask>): Promise<DashboardTask> => {
  const { data, error } = await supabase
    .from('dashboard_tasks')
    .insert({
      task_type_id: task.task_type_id || null,
      title: task.title || 'New Task',
      description: task.description || null,
      status: task.status || 'pending',
      priority: task.priority || 'normal',
      assigned_to: task.assigned_to || null,
      deadline: task.deadline || null,
      created_by: task.created_by,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateDashboardTask = async (taskId: string, updates: Partial<DashboardTask>): Promise<DashboardTask> => {
  const updateData: any = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (updates.status === 'completed' && !updates.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('dashboard_tasks')
    .update(updateData)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteDashboardTask = async (taskId: string): Promise<void> => {
  const { error } = await supabase
    .from('dashboard_tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
};

// Widget Data
export const getWidgetData = async (widgetId: string): Promise<WidgetData[]> => {
  const { data, error } = await supabase
    .from('widget_data')
    .select('*')
    .eq('widget_id', widgetId);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
};

export const upsertWidgetData = async (widgetId: string, dataKey: string, dataValue: Record<string, any>): Promise<void> => {
  const { error } = await supabase
    .rpc('upsert_widget_data', {
      p_widget_id: widgetId,
      p_data_key: dataKey,
      p_data_value: dataValue,
    });

  if (error) throw error;
};


