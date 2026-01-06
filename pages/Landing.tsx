import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BookOpen, 
  Brain, 
  FileText, 
  FolderOpen, 
  Megaphone, 
  Settings, 
  Shield,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Landing() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: 'Knowledge Base',
      description: 'Comprehensive internal documentation and guides for quick reference'
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI Assistant',
      description: 'Intelligent AI-powered tools to help you work smarter and faster'
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Complaint Generator',
      description: 'Professional complaint templates generated instantly with AI'
    },
    {
      icon: <FolderOpen className="w-8 h-8" />,
      title: 'File Library',
      description: 'Centralized resource hub for all your documents and files'
    },
    {
      icon: <Megaphone className="w-8 h-8" />,
      title: 'Announcements',
      description: 'Stay updated with important team news and updates'
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: 'Admin Dashboard',
      description: 'Powerful management tools for team leaders and administrators'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Secure Access',
      description: 'Role-based permissions with approval workflow system'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B0F0F] via-[#6A1B2C] to-[#2C0A0A] text-white overflow-hidden">
      {/* Simple Landing Header - NOT the main app navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#4B0F0F]/80 backdrop-blur-lg border-b border-[#F8C147]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src="https://miaoda-conversation-file.s3cdn.medo.dev/user-7r3p9m8hrh1c/conv-7tw4zia1j9j4/20251129/file-7vfzqkto0t8g.png" 
                alt="Shawarmer Logo" 
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/shawarmer-logo.png';
                }}
              />
              <span className="text-xl font-bold text-white hidden sm:inline-block" dir="rtl">
                دفتر الطراريح - شاورمر 😄
              </span>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => navigate('/register')}
                variant="ghost"
                className="text-white hover:text-[#F8C147] hover:bg-white/10"
              >
                Register
              </Button>
              <Button 
                onClick={() => navigate('/login')}
                variant="outline"
                className="border-[#F8C147] text-[#F8C147] hover:bg-[#F8C147] hover:text-[#4B0F0F]"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#F8C147] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-[#FFB300] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-[#F8C147] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20 pt-32">{/* Added pt-32 for header spacing */}
        <div className={`max-w-6xl mx-auto text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[#F8C147] rounded-full blur-3xl opacity-30 animate-pulse" />
              <img 
                src="https://miaoda-conversation-file.s3cdn.medo.dev/user-7r3p9m8hrh1c/conv-7tw4zia1j9j4/20251129/file-7vfzqkto0t8g.png" 
                alt="Shawarmer Logo" 
                className="relative h-32 xl:h-40 w-auto object-contain drop-shadow-2xl"
                onError={(e) => {
                  e.currentTarget.src = '/shawarmer-logo.png';
                }}
              />
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl xl:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-[#F8C147] to-white bg-clip-text text-transparent animate-gradient">
            Your Ultimate Customer Service Knowledge Hub
          </h1>

          {/* Sub-headline */}
          <p className="text-xl xl:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            A smart, centralized platform designed to empower agents with tools, knowledge, and AI-powered assistance.
          </p>

          {/* CTA Button */}
          <Button
            onClick={() => navigate('/login')}
            size="lg"
            className="bg-gradient-to-r from-[#F8C147] to-[#FFB300] hover:from-[#FFB300] hover:to-[#F8C147] text-[#4B0F0F] font-bold text-lg px-12 py-6 rounded-full shadow-2xl hover:shadow-[#F8C147]/50 transition-all duration-300 hover:scale-105 group"
          >
            Enter Portal
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>

          {/* Scroll Indicator */}
          <div className="mt-20 animate-bounce">
            <div className="w-6 h-10 border-2 border-[#F8C147] rounded-full mx-auto flex items-start justify-center p-2">
              <div className="w-1 h-3 bg-[#F8C147] rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl xl:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-[#F8C147] to-[#FFB300] bg-clip-text text-transparent">
                About The Platform
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#F8C147] to-[#FFB300] mx-auto mb-8" />
          </div>

          <Card className="bg-white/5 backdrop-blur-lg border-[#F8C147]/20 hover:border-[#F8C147]/40 transition-all duration-300">
            <CardContent className="p-8 xl:p-12">
              <p className="text-lg xl:text-xl text-gray-300 leading-relaxed text-center max-w-4xl mx-auto" dir="rtl">
                مرحباً بك في <span className="text-[#F8C147] font-semibold">دفتر الطراريح - شاورمر 😄</span> — 
                منصة شاملة مصممة لتسهيل عملك وزيادة إنتاجيتك. 
                يجمع هذا النظام <span className="text-[#F8C147]">قاعدة معرفة داخلية</span>، 
                <span className="text-[#F8C147]"> أدوات ذكاء اصطناعي</span>، 
                <span className="text-[#F8C147]"> أدوات ومصادر أساسية</span>، 
                و<span className="text-[#F8C147]">أدوات إدارية قوية</span> — 
                كل شيء في مكان واحد مصمم خصيصاً لتميز خدمة العملاء.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl xl:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-[#F8C147] to-[#FFB300] bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#F8C147] to-[#FFB300] mx-auto mb-8" />
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Everything you need to deliver exceptional customer service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-lg border-[#F8C147]/20 hover:border-[#F8C147]/60 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-[#F8C147]/20 group cursor-pointer"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <CardContent className="p-8">
                  <div className="mb-4 text-[#F8C147] group-hover:text-[#FFB300] transition-colors duration-300 group-hover:scale-110 transform transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-[#F8C147] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#F8C147] to-[#FFB300] rounded-3xl blur-3xl opacity-20" />
            <Card className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-[#F8C147]/30">
              <CardContent className="p-12 xl:p-16">
                <h2 className="text-4xl xl:text-5xl font-bold mb-6">
                  Ready to enter your{' '}
                  <span className="bg-gradient-to-r from-[#F8C147] to-[#FFB300] bg-clip-text text-transparent">
                    Customer Service HQ?
                  </span>
                </h2>
                <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                  Join your team and access all the tools you need to provide exceptional customer support
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  size="lg"
                  className="bg-gradient-to-r from-[#F8C147] to-[#FFB300] hover:from-[#FFB300] hover:to-[#F8C147] text-[#4B0F0F] font-bold text-xl px-16 py-8 rounded-full shadow-2xl hover:shadow-[#F8C147]/50 transition-all duration-300 hover:scale-110 group"
                >
                  Login to Continue
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 border-t border-[#F8C147]/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
            <div className="text-center xl:text-left flex flex-col xl:flex-row items-center gap-4">
              <img 
                src="https://miaoda-conversation-file.s3cdn.medo.dev/user-7r3p9m8hrh1c/conv-7tw4zia1j9j4/20251129/file-7vfzqkto0t8g.png" 
                alt="Shawarmer Logo" 
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/shawarmer-logo.png';
                }}
              />
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-[#F8C147] to-[#FFB300] bg-clip-text text-transparent mb-2" dir="rtl">
                  دفتر الطراريح - شاورمر 😄
                </h3>
                <p className="text-gray-400 text-sm" dir="rtl">
                  نمكّن التميز في خدمة العملاء
                </p>
              </div>
            </div>
            <div className="text-center xl:text-right">
              <p className="text-gray-400 text-sm">
                Powered by <span className="text-[#F8C147] font-semibold">Base44</span>
              </p>
              <p className="text-gray-500 text-xs mt-1">
                © 2025 Shawarmer. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
