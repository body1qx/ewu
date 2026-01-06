import type { ReactNode } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Pending from './pages/Pending';
import Suspended from './pages/Suspended';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import EmployeeRoles from './pages/admin/EmployeeRoles';
import AISettings from './pages/admin/AISettings';
import SystemSettings from './pages/admin/SystemSettings';
import ScheduleManagement from './pages/admin/ScheduleManagement';
import LeaveManagement from './pages/admin/LeaveManagement';
import AnnouncementManagement from './pages/admin/AnnouncementManagement';
import KnowledgeManagement from './pages/admin/KnowledgeManagement';
import DailyBreakReport from './pages/admin/DailyBreakReport';
import EmployeeBreakReport from './pages/admin/EmployeeBreakReport';
import WarningsCenter from './pages/admin/WarningsCenter';
import KnowledgeBase from './pages/KnowledgeBase';
import KnowledgeBaseCategory from './pages/KnowledgeBaseCategory';
import KnowledgeBaseEditor from './pages/KnowledgeBaseEditor';
import KnowledgeBaseArticleView from './pages/KnowledgeBaseArticleView';
import KnowledgeBaseCategoryManager from './pages/admin/KnowledgeBaseCategoryManager';
import BranchDirectory from './pages/BranchDirectory';
import MenuItemsNutrition from './pages/MenuItemsNutrition';
import SocialMediaResponses from './pages/SocialMediaResponses';
import CustomerCaseNotes from './pages/CustomerCaseNotes';
import AIAssistant from './pages/AIAssistant';
import Tools from './pages/Tools';
import FilesHub from './pages/FilesHub';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Schedules from './pages/Schedules';
import AnnualLeave from './pages/employee/AnnualLeave';
import MyWarnings from './pages/employee/MyWarnings';
import AnnouncementsPage from './pages/announcements/AnnouncementsPage';
import AnnouncementDetail from './pages/announcements/AnnouncementDetail';
import AnnouncementForm from './pages/announcements/AnnouncementForm';
import FoodPoisoningCases from './pages/FoodPoisoningCases';
import ShiftHandover from './pages/ShiftHandover';
import BlacklistPage from './pages/blacklist/BlacklistPage';
import CustomerBlacklistPage from './pages/CustomerBlacklist';
import AttendancePage from './pages/AttendancePage';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/home',
    element: <Home />,
    visible: false,
  },
  {
    name: 'Login',
    path: '/login',
    element: <Login />,
    visible: false,
  },
  {
    name: 'Register',
    path: '/register',
    element: <Register />,
    visible: false,
  },
  {
    name: 'Pending',
    path: '/pending',
    element: <Pending />,
    visible: false,
  },
  {
    name: 'Suspended',
    path: '/suspended',
    element: <Suspended />,
    visible: false,
  },
  {
    name: 'Admin Dashboard',
    path: '/admin',
    element: <AdminDashboard />,
    visible: false,
  },
  {
    name: 'User Management',
    path: '/admin/users',
    element: <UserManagementPage />,
    visible: false,
  },
  {
    name: 'Employee Roles',
    path: '/admin/employee-roles',
    element: <EmployeeRoles />,
    visible: false,
  },
  {
    name: 'AI Settings',
    path: '/admin/ai-settings',
    element: <AISettings />,
    visible: false,
  },
  {
    name: 'System Settings',
    path: '/admin/system-settings',
    element: <SystemSettings />,
    visible: false,
  },
  {
    name: 'Schedule Management',
    path: '/admin/schedules',
    element: <ScheduleManagement />,
    visible: false,
  },
  {
    name: 'Leave Management',
    path: '/admin/leave-management',
    element: <LeaveManagement />,
    visible: false,
  },
  {
    name: 'Warnings Center',
    path: '/admin/warnings',
    element: <WarningsCenter />,
    visible: false,
  },
  {
    name: 'Announcement Management',
    path: '/admin/announcements',
    element: <AnnouncementManagement />,
    visible: false,
  },
  {
    name: 'Knowledge Management',
    path: '/admin/knowledge',
    element: <KnowledgeManagement />,
    visible: false,
  },
  {
    name: 'Daily Break Report',
    path: '/admin/break-report',
    element: <DailyBreakReport />,
    visible: false,
  },
  {
    name: 'Employee Break Report',
    path: '/admin/employee-break-report',
    element: <EmployeeBreakReport />,
    visible: false,
  },
  {
    name: 'Announcements',
    path: '/announcements',
    element: <AnnouncementsPage />,
    visible: false,
  },
  {
    name: 'Announcement Detail',
    path: '/announcements/:id',
    element: <AnnouncementDetail />,
    visible: false,
  },
  {
    name: 'Create Announcement',
    path: '/announcements/create',
    element: <AnnouncementForm />,
    visible: false,
  },
  {
    name: 'Edit Announcement',
    path: '/announcements/edit/:id',
    element: <AnnouncementForm />,
    visible: false,
  },
  {
    name: 'Knowledge Base',
    path: '/knowledge-base',
    element: <KnowledgeBase />,
    visible: false,
  },
  {
    name: 'Knowledge Base Category',
    path: '/knowledge-base/category/:categoryId',
    element: <KnowledgeBaseCategory />,
    visible: false,
  },
  {
    name: 'View Article',
    path: '/knowledge-base/article/:articleId',
    element: <KnowledgeBaseArticleView />,
    visible: false,
  },
  {
    name: 'Blacklist',
    path: '/blacklist',
    element: <BlacklistPage />,
    visible: false,
  },
  {
    name: 'Customer Blacklist',
    path: '/customer-blacklist',
    element: <CustomerBlacklistPage />,
    visible: false,
  },
  {
    name: 'New Article',
    path: '/knowledge-base/new',
    element: <KnowledgeBaseEditor />,
    visible: false,
  },
  {
    name: 'Create Article',
    path: '/knowledge-base/create',
    element: <KnowledgeBaseEditor />,
    visible: false,
  },
  {
    name: 'Edit Article',
    path: '/knowledge-base/edit/:articleId',
    element: <KnowledgeBaseEditor />,
    visible: false,
  },
  {
    name: 'Manage Categories',
    path: '/knowledge-base/manage',
    element: <KnowledgeBaseCategoryManager />,
    visible: false,
  },
  {
    name: 'Branch Directory',
    path: '/branches',
    element: <BranchDirectory />,
    visible: false,
  },
  {
    name: 'Menu Items & Nutrition',
    path: '/menu-nutrition',
    element: <MenuItemsNutrition />,
    visible: false,
  },
  {
    name: 'Social Media Responses',
    path: '/social-media-responses',
    element: <SocialMediaResponses />,
    visible: false,
  },
  {
    name: 'Customer Case Notes',
    path: '/case-notes',
    element: <CustomerCaseNotes />,
    visible: false,
  },
  {
    name: 'Schedules',
    path: '/schedules',
    element: <Schedules />,
    visible: false,
  },
  {
    name: 'Annual Leave',
    path: '/annual-leave',
    element: <AnnualLeave />,
    visible: false,
  },
  {
    name: 'My Warnings',
    path: '/warnings',
    element: <MyWarnings />,
    visible: false,
  },
  {
    name: 'Warning Details',
    path: '/warnings/:id',
    element: <MyWarnings />,
    visible: false,
  },
  {
    name: 'Shift Handover',
    path: '/shift-handover',
    element: <ShiftHandover />,
    visible: false,
  },
  {
    name: 'Attendance',
    path: '/attendance',
    element: <AttendancePage />,
    visible: false,
  },
  {
    name: 'AI Assistant',
    path: '/ai-assistant',
    element: <AIAssistant />,
    visible: false,
  },
  {
    name: 'Tools & Resources',
    path: '/tools',
    element: <Tools />,
    visible: false,
  },
  {
    name: 'Files',
    path: '/files',
    element: <FilesHub />,
    visible: false,
  },
  {
    name: 'Profile',
    path: '/profile',
    element: <Profile />,
    visible: false,
  },
  {
    name: 'Notifications',
    path: '/notifications',
    element: <Notifications />,
    visible: false,
  },
  {
    name: 'Food Poisoning Cases',
    path: '/food-poisoning-cases',
    element: <FoodPoisoningCases />,
    visible: false,
  },
];

export default routes;
export type { RouteConfig };