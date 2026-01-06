import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import MainAppLayout from '@/components/layouts/MainAppLayout';

// Pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Pending from '@/pages/Pending';
import Suspended from '@/pages/Suspended';
import Home from '@/pages/Home';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import UserManagementPage from '@/pages/admin/UserManagementPage';
import EmployeeRoles from '@/pages/admin/EmployeeRoles';
import AISettings from '@/pages/admin/AISettings';
import SystemSettings from '@/pages/admin/SystemSettings';
import AnnouncementsPage from '@/pages/announcements/AnnouncementsPage';
import AnnouncementDetail from '@/pages/announcements/AnnouncementDetail';
import AnnouncementForm from '@/pages/announcements/AnnouncementForm';
import KnowledgeBase from '@/pages/KnowledgeBase';
import KnowledgeBaseCategory from '@/pages/KnowledgeBaseCategory';
import KnowledgeBaseArticleView from '@/pages/KnowledgeBaseArticleView';
import KnowledgeBaseEditor from '@/pages/KnowledgeBaseEditor';
import KnowledgeBaseCategoryManager from '@/pages/admin/KnowledgeBaseCategoryManager';
import AIAssistant from '@/pages/AIAssistant';
import Tools from '@/pages/Tools';
import FilesHub from '@/pages/FilesHub';
import Profile from '@/pages/Profile';
import Notifications from '@/pages/Notifications';
import Schedules from '@/pages/Schedules';
import ScheduleManagement from '@/pages/admin/ScheduleManagement';
import AnnualLeave from '@/pages/employee/AnnualLeave';
import LeaveManagement from '@/pages/admin/LeaveManagement';
import DailyBreakReport from '@/pages/admin/DailyBreakReport';
import ComprehensiveAttendanceReport from '@/pages/admin/ComprehensiveAttendanceReport';
import FoodPoisoningCases from '@/pages/FoodPoisoningCases';
import ShiftHandover from '@/pages/ShiftHandover';
import BlacklistPage from '@/pages/blacklist/BlacklistPage';
import CustomerBlacklistPage from '@/pages/CustomerBlacklist';
import BranchDirectory from '@/pages/BranchDirectory';
import SocialMediaResponses from '@/pages/SocialMediaResponses';
import CustomerCaseNotes from '@/pages/CustomerCaseNotes';
import MenuItemsNutrition from '@/pages/MenuItemsNutrition';
import CommonIssuesCompensation from '@/pages/CommonIssuesCompensation';
import OffersPromotions from '@/pages/OffersPromotions';
import AttendancePage from '@/pages/AttendancePage';
import WarningsCenter from '@/pages/admin/WarningsCenter';
import MyWarnings from '@/pages/employee/MyWarnings';
import DashboardManagement from '@/pages/admin/DashboardManagement';
import DashboardBuilder from '@/pages/admin/DashboardBuilder';

// Protected Route wrapper for main app routes - DEFINED OUTSIDE AppRoutes
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // CRITICAL: Wait for profile to load before making routing decisions
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check user status - PRIORITY: Pending and Suspended users must be redirected
  if (profile.status === 'pending') {
    return <Navigate to="/pending" replace />;
  }

  if (profile.status === 'suspended') {
    return <Navigate to="/suspended" replace />;
  }

  // Only active users can access protected routes
  if (profile.status !== 'active') {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
}

// Status page wrapper - DEFINED OUTSIDE AppRoutes
function StatusPageRoute({ children, requiredStatus }: { children: React.ReactNode; requiredStatus: 'pending' | 'suspended' }) {
  const { user, profile, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Show loading while profile loads
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Simple status check - if matches, render the page
  if (profile.status === requiredStatus) {
    return <>{children}</>;
  }

  // Redirect based on actual status
  if (profile.status === 'active') {
    return <Navigate to="/home" replace />;
  }

  if (profile.status === 'pending') {
    return <Navigate to="/pending" replace />;
  }

  if (profile.status === 'suspended') {
    return <Navigate to="/suspended" replace />;
  }

  // Default fallback
  return <Navigate to="/login" replace />;
}

// Redirect authenticated users from landing/auth pages - DEFINED OUTSIDE AppRoutes
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  // If user is authenticated, do NOT allow access to /login or /register
  if (user) {
    // Just send them to /home, and let ProtectedRoute handle status (pending/suspended/active)
    return <Navigate to="/home" replace />;
  }

  // Not logged in → show the auth page
  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root redirects to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Standalone Login Page - Full-screen cinematic design */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Standalone Registration Page - Full-screen cinematic design */}
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Special status pages - standalone, no layout wrapper but require auth */}
      <Route 
        path="/pending" 
        element={
          <StatusPageRoute requiredStatus="pending">
            <Pending />
          </StatusPageRoute>
        } 
      />
      <Route 
        path="/suspended" 
        element={
          <StatusPageRoute requiredStatus="suspended">
            <Suspended />
          </StatusPageRoute>
        } 
      />

      {/* Layer 3: Main Application - MainAppLayout (full navbar) */}
      <Route
        element={
          <ProtectedRoute>
            <MainAppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<Home />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/announcements/:id" element={<AnnouncementDetail />} />
        <Route path="/announcements/create" element={<AnnouncementForm />} />
        <Route path="/announcements/edit/:id" element={<AnnouncementForm />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />
        <Route path="/knowledge-base/category/:categoryId" element={<KnowledgeBaseCategory />} />
        <Route path="/knowledge-base/article/:articleId" element={<KnowledgeBaseArticleView />} />
        <Route path="/knowledge-base/new" element={<KnowledgeBaseEditor />} />
        <Route path="/knowledge-base/edit/:articleId" element={<KnowledgeBaseEditor />} />
        <Route path="/knowledge-base/manage" element={<KnowledgeBaseCategoryManager />} />
        <Route path="/menu-nutrition" element={<MenuItemsNutrition />} />
        <Route path="/common-issues" element={<CommonIssuesCompensation />} />
        <Route path="/offers-promotions" element={<OffersPromotions />} />
        <Route path="/social-media-responses" element={<SocialMediaResponses />} />
        <Route path="/case-notes" element={<CustomerCaseNotes />} />
        <Route path="/branches" element={<BranchDirectory />} />
        <Route path="/blacklist" element={<BlacklistPage />} />
        <Route path="/customer-blacklist" element={<CustomerBlacklistPage />} />
        <Route path="/schedules" element={<Schedules />} />
        <Route path="/shift-handover" element={<ShiftHandover />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/annual-leave" element={<AnnualLeave />} />
        <Route path="/food-poisoning-cases" element={<FoodPoisoningCases />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/files" element={<FilesHub />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/warnings" element={<MyWarnings />} />
        <Route path="/warnings/:id" element={<MyWarnings />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/employee-roles" element={<EmployeeRoles />} />
        <Route path="/admin/schedules" element={<ScheduleManagement />} />
        <Route path="/admin/leave-management" element={<LeaveManagement />} />
        <Route path="/admin/warnings" element={<WarningsCenter />} />
        <Route path="/admin/break-report" element={<DailyBreakReport />} />
        <Route path="/admin/comprehensive-report" element={<ComprehensiveAttendanceReport />} />
        <Route path="/admin/dashboards" element={<DashboardManagement />} />
        <Route path="/admin/dashboards/:id/builder" element={<DashboardBuilder />} />
        <Route path="/admin/ai-settings" element={<AISettings />} />
        <Route path="/admin/system-settings" element={<SystemSettings />} />
      </Route>

      {/* Catch all - redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
