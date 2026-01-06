export type UserRole = 'admin' | 'writer' | 'employee' | 'supervisor' | 'quality' | 'team_leader' | 'guest';
export type UserStatus = 'active' | 'pending' | 'suspended';
export type AnnouncementPriority = 'high' | 'normal' | 'low';
export type AnnouncementStatus = 'draft' | 'published';
export type NotificationType = 'system' | 'announcement' | 'file' | 'admin' | 'status' | 'shift_handover' | 'annual_leave' | 'blacklist' | 'warning';
export type ShiftType = 'morning' | 'night' | 'afternoon' | 'general';
export type ShiftPriority = 'normal' | 'high' | 'urgent';
export type ShiftStatus = 
  | 'working' 
  | 'off' 
  | 'work_from_home' 
  | 'annual_vacation_regular' 
  | 'annual_vacation_normal'
  | 'annual_vacation_emergency' 
  | 'public_holiday' 
  | 'exam_leave' 
  | 'sick_day';
export type EmployeePosition = 'CRM Agent' | 'CRM Quality' | 'CRM Team Leader' | 'CRM Supervisor' | 'CRM Manager';

export type FraudType = 
  | 'fake_complaint' 
  | 'repeated_compensation' 
  | 'abusive_language' 
  | 'delivery_fraud' 
  | 'refund_abuse' 
  | 'other';

export type RiskLevel = 'low' | 'medium' | 'high';
export type FraudBlacklistStatus = 'active' | 'under_review' | 'cleared';
export type CustomerBlacklistStatus = 'active' | 'removed';

export interface CustomerBlacklist {
  id: string;
  phone_number: string;
  customer_name: string | null;
  reason: string;
  date_blacklisted: string;
  reported_by_id: string | null;
  reported_by_name: string | null;
  status: CustomerBlacklistStatus;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  employee_id: string | null;
  role: UserRole;
  status: UserStatus;
  team: string | null;
  position: EmployeePosition | null;
  profile_image_url: string | null;
  avatar_position: { x: number; y: number; zoom: number } | null;
  language: string;
  join_date: string;
  last_login: string | null;
  is_schedulable: boolean;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  content: string | null;
  banner_image_url: string | null;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  is_published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  scheduled_date: string | null;
  category: string;
  target_audience: string;
  target_roles: string[];
  target_teams: string[];
  images: string[];
  attachments: string[];
  is_bookmarked_by: string[];
  read_by: string[];
  view_count: number;
  creator?: Profile;
}

export interface ShiftHandoverNote {
  id: string;
  created_at: string;
  created_by: string;
  shift_type: ShiftType;
  title: string;
  content: string;
  priority: ShiftPriority;
  follow_up_required: boolean;
  tags: string[];
  images: string[];
  team: string | null;
  time_range_start: string | null;
  time_range_end: string | null;
  related_ticket_link: string | null;
  is_draft: boolean;
  is_pinned: boolean;
  is_resolved: boolean;
  creator?: Profile;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Content Block Types for Rich Article Content
export type ContentBlockType = 'paragraph' | 'heading' | 'image' | 'callout' | 'steps' | 'table' | 'gallery' | 'list';
export type CalloutStyle = 'info' | 'warning' | 'success' | 'tip';

export interface ContentBlockMetadata {
  level?: 1 | 2 | 3; // For headings
  style?: CalloutStyle; // For callouts
  caption?: string; // For images
  captionAr?: string; // Arabic caption
  images?: string[]; // For galleries
  ordered?: boolean; // For lists
  columns?: string[]; // For tables
  rows?: string[][]; // For tables
}

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string;
  contentAr?: string; // Arabic content
  metadata?: ContentBlockMetadata;
}

export interface ArticleContentBlocks {
  blocks: ContentBlock[];
}

export interface KnowledgeArticle {
  id: string;
  category_id: string | null;
  title: string;
  title_ar?: string | null;
  content: string;
  content_blocks?: ArticleContentBlocks;
  description?: string | null;
  pinned?: boolean;
  view_count?: number;
  tags?: string[];
  author_id: string | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface KnowledgeFavorite {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
}

export interface KnowledgeArticleAttachment {
  id: string;
  article_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface ToolCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  order_index: number;
  created_at: string;
}

export interface Tool {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  url: string;
  category_id: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ToolWithCategory extends Tool {
  category?: ToolCategory;
}

export interface FileRecord {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  link?: string;
  metadata?: Record<string, any>;
}

export interface AnnouncementWithCreator extends Announcement {
  creator?: Profile;
}

export interface KnowledgeArticleWithDetails extends KnowledgeArticle {
  category?: KnowledgeCategory;
  author?: Profile;
  attachments?: KnowledgeArticleAttachment[];
}

export interface FileRecordWithUploader extends FileRecord {
  uploader?: Profile;
}

export type TaskType = 'Call' | 'Live Chat' | 'WhatsApp' | 'Partoo' | 'Social';

export interface Schedule {
  id: string;
  user_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  status: ShiftStatus;
  notes: string | null;
  tasks: TaskType[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleWithEmployee extends Schedule {
  employee?: Profile;
  creator?: Profile;
}

export interface TaskStatistics {
  task_name: TaskType;
  total_assignments: number;
  unique_employees: number;
}

export interface EmployeeTaskLoad {
  user_id: string;
  full_name: string;
  total_shifts: number;
  total_tasks: number;
  avg_tasks_per_shift: number;
  task_breakdown: Record<TaskType, number>;
}

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type LeaveType = 'normal' | 'emergency';

export interface EmployeeLeaveBalance {
  id: string;
  user_id: string;
  year: number;
  base_days: number;
  overtime_days: number;
  emergency_days: number;
  total_days: number;
  used_days: number;
  emergency_used_days: number;
  remaining_days: number;
  emergency_remaining_days: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  request_date: string;
  status: LeaveRequestStatus;
  total_days: number;
  reason: string | null;
  leave_type: LeaveType;
  approver_id: string | null;
  approval_date: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveDay {
  id: string;
  request_id: string;
  user_id: string;
  leave_date: string;
  leave_type: LeaveType;
  status: LeaveRequestStatus;
  created_at: string;
}

export interface LeaveRequestWithDetails extends LeaveRequest {
  employee?: Profile;
  approver?: Profile;
  leave_days?: LeaveDay[];
}

export interface LeaveConflict {
  conflict_date: string;
  conflict_user_id: string;
  conflict_user_name: string;
}

export type CancellationRequestStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveCancellationRequest {
  id: string;
  leave_request_id: string;
  requested_by: string;
  request_reason: string | null;
  requested_at: string;
  status: CancellationRequestStatus;
  admin_response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaveCancellationRequestWithDetails extends LeaveCancellationRequest {
  leave_request?: LeaveRequestWithDetails;
  requester?: Profile;
  responder?: Profile;
}

// ============================================
// FILES HUB TYPES
// ============================================

export type FileType = 'pdf' | 'excel';
export type FileCategory = 'Reports' | 'Training' | 'Policies' | 'Templates' | 'Other';
export type FileSortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'size_asc' | 'size_desc';
export type FileViewMode = 'grid' | 'table';

export interface CSFile {
  id: string;
  file_name: string;
  file_type: FileType;
  file_extension: string;
  file_size: number;
  file_path: string;
  file_url: string | null;
  category: FileCategory;
  tags: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface CSFileWithUploader extends CSFile {
  uploader?: Profile;
}

export interface FileFilters {
  search: string;
  category: FileCategory | 'All';
  fileType: FileType | 'all';
  sortBy: FileSortOption;
}

// ============================================
// FOOD POISONING CASE TYPES
// ============================================

export type FoodPoisoningOutcome = 'recovered' | 'on_treatment' | 'more_complications';

export interface FoodPoisoningCase {
  id: string;
  case_number: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  
  // General Information
  customer_name: string;
  contact_number: string | null;
  age: number | null;
  store_location: string | null;
  order_date: string | null;
  complaint_date: string | null;
  
  // Signs and Symptoms
  symptom_diarrhea: boolean;
  symptom_vomiting: boolean;
  symptom_abdominal_cramps: boolean;
  symptom_fever: boolean;
  symptom_nausea: boolean;
  symptom_malaise: boolean;
  symptom_headache: boolean;
  symptom_body_ache: boolean;
  symptom_other: string | null;
  
  // History of Illness
  illness_onset_date: string | null;
  illness_onset_time: string | null;
  illness_duration_days: number | null;
  hospitalization: boolean;
  hospitalization_date: string | null;
  travel_history: string | null;
  outcome: FoodPoisoningOutcome | null;
  outcome_complications: string | null;
  
  // Food History
  last_meal_details: string | null;
  previous_meal_details: string | null;
  
  // Contacts/Family & Order Details
  sick_contacts: string | null;
  order_details: string | null;
  
  // Lab Investigation & Completion
  lab_stool: boolean;
  lab_rectal_swab: boolean;
  lab_rectal_swab_datetime: string | null;
  form_completed_by: string | null;
  form_completion_date: string | null;
  comments: string | null;
  
  // PDF Generation Tracking
  pdf_generated_languages: string[];
}

export interface FoodPoisoningCaseWithCreator extends FoodPoisoningCase {
  creator?: Profile;
}

// ============================================
// BLACKLIST CUSTOMER TYPES
// ============================================

export interface BlacklistCustomer {
  id: string;
  customer_name: string | null;
  phone_number: string | null;
  email: string | null;
  zoho_contact_id: string | null;
  branch: string | null;
  city: string | null;
  fraud_types: FraudType[];
  description_en: string | null;
  description_ar: string | null;
  zoho_ticket_ids: string[];
  order_ids: string[];
  attachment_links: string[];
  risk_level: RiskLevel;
  status: FraudBlacklistStatus;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
}

export interface BlacklistCustomerWithCreator extends BlacklistCustomer {
  creator?: Profile;
  updater?: Profile;
}

// ============================================
// BRANCH DIRECTORY TYPES
// ============================================

export type BranchStatus = 'open' | 'temporarily_closed' | 'under_renovation' | 'permanent_closed';

export interface BranchImage {
  id: string;
  branch_id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
  city: string;
  street: string | null;
  has_drive_thru: boolean;
  is_franchise: boolean;
  is_24_hours: boolean;
  opening_time: string;
  closing_time: string;
  opening_time_in_friday: string;
  closing_time_in_friday: string;
  status: BranchStatus;
  store_manager_name: string | null;
  store_manager_phone: string | null;
  store_manager_email: string | null;
  area_manager_name: string | null;
  area_manager_phone: string | null;
  area_manager_email: string | null;
  notes: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  images?: BranchImage[];
}

export type ResponsePlatform = 
  | 'general'
  | 'instagram'
  | 'twitter'
  | 'tiktok'
  | 'facebook'
  | 'email'
  | 'whatsapp';

export type ResponseLanguage = 'ar' | 'en' | 'bilingual';

export type ResponseTone = 
  | 'formal'
  | 'friendly'
  | 'professional'
  | 'apologetic'
  | 'enthusiastic';

export type ResponseSentiment = 
  | 'apology'
  | 'thanks'
  | 'info'
  | 'follow_up'
  | 'greeting';

export interface SocialCannedResponse {
  id: string;
  title: string;
  platform: ResponsePlatform;
  category: string;
  language: ResponseLanguage;
  tone: ResponseTone;
  sentiment: ResponseSentiment;
  tags: string[];
  reply_ar: string;
  reply_en: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CaseStatus = 'open' | 'pending_tl' | 'escalated' | 'closed';

export interface CaseNote {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  issue_category: string;
  description: string;
  action_taken: string;
  status: CaseStatus;
  attachments: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
  is_new?: boolean;
  expires_at?: string;
  creator?: Profile;
  updater?: Profile;
  creator_name?: string;
  creator_avatar?: string;
  creator_role?: string;
}

export interface CaseNoteUpdate {
  id: string;
  case_id: string;
  update_text: string;
  status_changed_from: CaseStatus | null;
  status_changed_to: CaseStatus | null;
  updated_by: string;
  created_at: string;
  updater?: Profile;
}

export interface CaseStatistics {
  total_cases: number;
  open_cases: number;
  pending_tl_cases: number;
  escalated_cases: number;
  closed_cases: number;
  cases_today: number;
  my_cases: number;
}

export interface MenuItem {
  id: string;
  name_en: string;
  name_ar: string | null;
  tagline_en: string | null;
  tagline_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  category: string;
  image_url: string | null;
  serving_size: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  sugar: number | null;
  sodium: number | null;
  allergens: string[] | null;
  preparation_notes: string | null;
  agent_notes: string | null;
  video_url: string | null;
  is_featured: boolean;
  display_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  sandwich_bread_type: string | null;
  sandwich_size: string | null;
  sandwich_toppings: string[] | null;
  sandwich_sauces: string[] | null;
  meal_main_item: string | null;
  meal_sides: string[] | null;
  meal_drink_included: boolean | null;
  meal_size: string | null;
  meal_components: Record<string, any> | null;
}

export type IssueCategory = 'delivery' | 'product' | 'app' | 'payment' | 'service' | 'other';
export type CompensationType = 'none' | 'apology_only' | 'discount' | 'free_item' | 'refund' | 'other';

export interface CommonIssue {
  id: string;
  issue_code: string;
  issue_title_en: string;
  issue_title_ar: string;
  issue_category: IssueCategory;
  description_en: string | null;
  description_ar: string | null;
  standard_action_en: string | null;
  standard_action_ar: string | null;
  compensation_type: CompensationType;
  compensation_details_en: string | null;
  compensation_details_ar: string | null;
  max_compensation_value: number | null;
  escalation_required: boolean;
  escalation_to: string | null;
  notes_en: string | null;
  notes_ar: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Promotions & Offers Types
export type PromoType = 'discount' | 'cashback' | 'bundle' | 'free_item' | 'voucher' | 'other';
export type DiscountType = 'percentage' | 'fixed_amount' | 'points' | 'none';
export type PromoStatus = 'active' | 'scheduled' | 'paused' | 'expired';
export type PromoChannel = 
  | 'app' 
  | 'website' 
  | 'call_center' 
  | 'talabat' 
  | 'jahez' 
  | 'hungerstation' 
  | 'dine_in' 
  | 'delivery' 
  | 'pickup';

export interface Promotion {
  id: string;
  promo_code: string | null;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  type: PromoType;
  discount_value: number | null;
  discount_type: DiscountType;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  channels: PromoChannel[];
  applicable_cities: string[] | null;
  start_date: string;
  end_date: string;
  status: PromoStatus;
  usage_limit_per_customer: number | null;
  global_usage_limit: number | null;
  current_usage_count: number;
  target_segment: string;
  terms_en: string;
  terms_ar: string;
  image_url: string | null;
  highlight: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type BreakType = 'normal' | 'prayer' | 'technical' | 'meeting' | 'auto_idle';
export type BreakSource = 'manual' | 'system_idle' | 'schedule_gap';

export interface Break {
  id: string;
  user_id: string;
  break_date: string;
  break_type: BreakType;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  notes: string | null;
  source: BreakSource;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSession {
  id: string;
  user_id: string;
  session_date: string;
  session_start: string;
  session_end: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  late_login_minutes: number;
  early_logout_minutes: number;
  is_late_login: boolean;
  is_early_logout: boolean;
  created_at: string;
  updated_at: string;
}

export interface MyBreaksToday {
  normal_total_minutes: number;
  meeting_total_minutes: number;
  remaining_minutes: number;
  active_break: {
    id: string;
    break_type: BreakType;
    start_time: string;
    notes: string | null;
  } | null;
  breaks: Break[];
}

export interface DailyBreakReportRow {
  user_id: string;
  full_name: string;
  role: string;
  team: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  first_login: string | null;
  last_logout: string | null;
  is_late_login: boolean;
  late_login_minutes: number;
  is_early_logout: boolean;
  early_logout_minutes: number;
  total_online_minutes: number;
  normal_break_minutes: number;
  meeting_break_minutes: number;
  break_count: number;
  exceeded_daily_limit: boolean;
  has_long_break: boolean;
  has_auto_idle: boolean;
}

export interface BreakWithEmployee extends Break {
  employee?: Profile;
}

export interface LiveBreakMonitor {
  id: string;
  user_id: string;
  full_name: string;
  role: UserRole;
  team: string | null;
  position: EmployeePosition | null;
  break_type: BreakType;
  start_time: string;
  duration_seconds: number;
  notes: string | null;
  allowed_limit_minutes: number;
  is_overtime: boolean;
  created_by: string | null;
  profile_image_url: string | null;
}

export interface DetailedBreakReportRow {
  user_id: string;
  full_name: string;
  role: string;
  team: string | null;
  break_id: string | null;
  break_type: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  notes: string | null;
  source: string | null;
  total_normal_breaks: number;
  total_meeting_breaks: number;
  time_exceeded: number;
  has_exceeded_limit: boolean;
  break_count: number;
}

export interface SystemSettings {
  id: number;
  auto_logout_enabled: boolean;
  inactivity_timeout_minutes: number;
  warning_time_minutes: number;
  session_duration_hours: number;
  updated_at: string;
  updated_by: string | null;
}

// Warnings & Alerts System Types
export type WarningType = 'notice' | 'warning' | 'strong_warning' | 'final_warning' | 'suspension_recommendation';
export type WarningSeverity = 'low' | 'medium' | 'high' | 'critical';
export type WarningStatus = 'active' | 'acknowledged' | 'resolved' | 'cancelled';

export interface EmployeeWarning {
  id: string;
  employee_id: string;
  issued_by: string;
  type: WarningType;
  severity: WarningSeverity;
  title: string;
  reason: string;
  incident_date: string;
  issued_at: string;
  status: WarningStatus;
  employee_response: string | null;
  acknowledged_at: string | null;
  points: number;
  attachments: any | null;
  related_module: string | null;
  related_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface WarningTemplate {
  id: string;
  type: WarningType;
  title: string;
  default_reason: string;
  points: number;
  created_at: string;
}

export interface WarningStats {
  total_warnings: number;
  active_warnings: number;
  total_points: number;
  last_warning_date: string | null;
  by_type: Record<WarningType, number>;
}

export interface WarningWithIssuer extends EmployeeWarning {
  issuer?: Profile;
  employee?: Profile;
}

// Dashboard System Types
export type DashboardLayoutType = 'grid' | 'masonry' | 'free';
export type WidgetType = 
  | 'metric' 
  | 'progress' 
  | 'task_list' 
  | 'status' 
  | 'text_block' 
  | 'counter' 
  | 'alert' 
  | 'chart' 
  | 'timeline' 
  | 'comparison'
  | 'leaderboard';

export type DashboardTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type DashboardTaskPriority = 'low' | 'normal' | 'high' | 'critical';

export interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  layout_type: DashboardLayoutType;
  is_active: boolean;
  display_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  dashboard_id: string;
  widget_type: WidgetType;
  title: string;
  config: Record<string, any>;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface WidgetTypeDefinition {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  default_config: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface DashboardPermission {
  id: string;
  dashboard_id: string;
  user_id: string | null;
  role: string | null;
  can_view: boolean;
  can_edit: boolean;
  created_at: string;
}

export interface DashboardTaskType {
  id: string;
  name: string;
  display_name: string;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface DashboardTask {
  id: string;
  task_type_id: string | null;
  title: string;
  description: string | null;
  status: DashboardTaskStatus;
  priority: DashboardTaskPriority;
  assigned_to: string | null;
  deadline: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WidgetData {
  id: string;
  widget_id: string;
  data_key: string;
  data_value: Record<string, any>;
  updated_at: string;
}

export interface DashboardWithWidgets extends Dashboard {
  widgets: DashboardWidget[];
  widget_count?: number;
}

export interface DashboardTaskWithDetails extends DashboardTask {
  task_type?: DashboardTaskType;
  assigned_user?: Profile;
  created_by_user?: Profile;
}

// Widget Configuration Types
export interface MetricWidgetConfig {
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'neutral';
  color: string;
  icon?: string;
  subtitle?: string;
}

export interface ProgressWidgetConfig {
  current: number;
  target: number;
  unit: string;
  color: string;
  show_percentage?: boolean;
}

export interface TaskListWidgetConfig {
  max_items: number;
  show_completed: boolean;
  task_type_filter?: string[];
  assigned_to_filter?: string[];
}

export interface StatusWidgetConfig {
  status: 'normal' | 'warning' | 'critical' | 'success';
  label: string;
  color: string;
  icon?: string;
  description?: string;
}

export interface TextBlockWidgetConfig {
  content: string;
  alignment: 'left' | 'center' | 'right';
  font_size?: string;
  color?: string;
}

export interface CounterWidgetConfig {
  value: number;
  label: string;
  color: string;
  icon?: string;
  animate?: boolean;
}

export interface LeaderboardWidgetConfig {
  entries: Array<{
    id: string;
    name: string;
    avatar?: string;
    score: number;
    change?: number;
    badge?: string;
  }>;
  period?: string;
  subtitle?: string;
  max_entries?: number;
  score_unit?: string;
  score_color?: string;
  show_stats?: boolean;
}

export interface AlertWidgetConfig {
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  dismissible?: boolean;
}

export interface ChartWidgetConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  data: any[];
  labels?: string[];
  colors?: string[];
}

export interface TimelineWidgetConfig {
  events: Array<{
    id: string;
    title: string;
    description?: string;
    timestamp: string;
    icon?: string;
    color?: string;
  }>;
  max_items?: number;
}

export interface ComparisonWidgetConfig {
  items: Array<{
    id: string;
    label: string;
    value: number;
    color?: string;
  }>;
  show_percentage?: boolean;
}

