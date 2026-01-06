import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, User, LogOut, Shield, Menu, X, Moon, Sun } from 'lucide-react';
import { getUnreadNotifications } from '@/db/api';
import { useTheme } from '@/components/theme-provider';
import AISearchBar from './AISearchBar';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (profile) {
      loadUnreadCount();
    }
  }, [profile]);

  // Hide header on landing page (after all hooks)
  if (location.pathname === '/landing') {
    return null;
  }

  const loadUnreadCount = async () => {
    if (!profile) return;
    try {
      const notifications = await getUnreadNotifications(profile.id);
      setUnreadCount(notifications.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = [
    { name: t('nav.home'), path: '/home' },
    { name: t('nav.announcements'), path: '/announcements' },
    { name: t('nav.knowledge_base'), path: '/knowledge-base' },
    { name: t('nav.schedules'), path: '/schedules' },
    { name: t('nav.shift_handover'), path: '/shift-handover' },
    { name: t('nav.annual_leave'), path: '/annual-leave' },
    { name: t('nav.food_poisoning'), path: '/food-poisoning-cases' },
    { name: t('nav.ai_assistant'), path: '/ai-assistant' },
    { name: t('nav.tools'), path: '/tools' },
    { name: t('nav.files'), path: '/files' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-r from-[#4B0F0F] via-[#6A1B2C] to-[#8B2635] shadow-2xl backdrop-blur-sm">
      {/* TOP ROW: Logo, AI Search, Profile */}
      <div className="border-b border-white/20 bg-black/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo - Far Left */}
            <Link to="/home" className="flex items-center space-x-3 flex-shrink-0 hover:opacity-90 transition-opacity">
              <img 
                src="https://miaoda-conversation-file.s3cdn.medo.dev/user-7r3p9m8hrh1c/conv-7tw4zia1j9j4/20251129/file-7vfzqkto0t8g.png" 
                alt="Shawarmer Logo" 
                className="h-10 w-auto object-contain drop-shadow-lg"
                onError={(e) => {
                  // Fallback to local logo if external URL fails
                  e.currentTarget.src = '/shawarmer-logo.png';
                }}
              />
              <span className="font-bold text-xl text-white hidden sm:inline-block drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" dir="rtl">
                {t('global.appName')}
              </span>
            </Link>

            {/* AI Search Bar - Center */}
            <AISearchBar className="flex-1 max-w-2xl mx-4 hidden md:block" />

            {/* Right Side Actions - Far Right */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm shadow-lg"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 drop-shadow-md" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 drop-shadow-md" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm shadow-lg"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="h-5 w-5 drop-shadow-md" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-[#F6B600] text-black border-0 shadow-lg font-bold"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/20 bg-white/10 backdrop-blur-sm shadow-lg">
                    <Avatar className="h-10 w-10 ring-2 ring-[#F6B600]/70 shadow-lg">
                      <AvatarImage src={profile?.profile_image_url || undefined} />
                      <AvatarFallback className="bg-[#F6B600] text-black font-semibold">
                        {getInitials(profile?.full_name || null)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{profile?.email}</p>
                      <Badge variant="outline" className="w-fit">
                        {profile?.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    {t('nav.profile')}
                  </DropdownMenuItem>
                  {profile?.role === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      {t('nav.admin')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm shadow-lg"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5 drop-shadow-md" /> : <Menu className="h-5 w-5 drop-shadow-md" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* SECOND ROW: Navigation Menu */}
      <div className="hidden md:block border-b border-white/20 bg-black/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-center space-x-1 h-12">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`relative text-white hover:bg-white/20 transition-all drop-shadow-md ${
                    location.pathname === item.path
                      ? 'text-[#F6B600] font-bold bg-white/10'
                      : 'hover:text-[#F6B600]'
                  }`}
                >
                  {item.name}
                  {location.pathname === item.path && (
                    <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#F6B600] rounded-full shadow-lg" />
                  )}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/20 backdrop-blur-sm">
          {/* Mobile AI Search */}
          <div className="container mx-auto px-4 py-3">
            <AISearchBar />
          </div>

          {/* Mobile Navigation */}
          <nav className="container mx-auto px-4 py-4 flex flex-col space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-white hover:bg-white/10 ${
                    location.pathname === item.path
                      ? 'bg-white/10 text-[#F6B600] font-semibold'
                      : ''
                  }`}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

