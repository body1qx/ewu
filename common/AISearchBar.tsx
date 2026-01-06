import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  FileText,
  Wrench,
  BookOpen,
  Megaphone,
  Home,
  ExternalLink,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import {
  getAllTools,
  getAllArticles,
  getPublishedAnnouncements,
  getAllFiles,
} from '@/db/api';
import type { Tool, KnowledgeArticle, Announcement, FileRecord } from '@/types/types';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'page' | 'tool' | 'knowledge' | 'announcement' | 'file';
  icon: React.ReactNode;
  action: () => void;
  url?: string;
  badge?: string;
}

interface AISearchBarProps {
  className?: string;
}

export default function AISearchBar({ className }: AISearchBarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  // Static pages data
  const pages = [
    { name: 'Home', path: '/', keywords: ['home', 'dashboard', 'main', 'start'] },
    { name: 'Announcements', path: '/announcements', keywords: ['announcements', 'news', 'updates', 'notifications'] },
    { name: 'Knowledge Base', path: '/knowledge-base', keywords: ['knowledge', 'articles', 'help', 'guide', 'documentation', 'how to'] },
    { name: 'AI Assistant', path: '/ai-assistant', keywords: ['ai', 'assistant', 'complaint', 'ticket', 'help'] },
    { name: 'Tools', path: '/tools', keywords: ['tools', 'resources', 'apps', 'platforms'] },
    { name: 'Files', path: '/files', keywords: ['files', 'documents', 'downloads', 'uploads'] },
    { name: 'Profile', path: '/profile', keywords: ['profile', 'account', 'settings', 'my account'] },
    { name: 'Notifications', path: '/notifications', keywords: ['notifications', 'alerts', 'messages'] },
  ];

  useEffect(() => {
    // Delay loading to avoid initialization issues
    const timer = setTimeout(() => {
      loadSearchData();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim()) {
      performAISearch(query);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  const loadSearchData = async () => {
    try {
      const [toolsData, articlesData, announcementsData, filesData] = await Promise.all([
        getAllTools().catch(() => []),
        getAllArticles().catch(() => []),
        getPublishedAnnouncements().catch(() => []),
        getAllFiles().catch(() => []),
      ]);
      setTools(toolsData);
      setArticles(articlesData);
      setAnnouncements(announcementsData);
      setFiles(filesData);
    } catch (error) {
      console.error('Error loading search data:', error);
      // Set empty arrays on error to prevent crashes
      setTools([]);
      setArticles([]);
      setAnnouncements([]);
      setFiles([]);
    }
  };

  const performAISearch = async (searchQuery: string) => {
    setIsSearching(true);
    setIsOpen(true);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const lowerQuery = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Intent detection keywords
    const intentKeywords = {
      complaint: ['complaint', 'issue', 'problem', 'report'],
      delivery: ['delivery', 'order', 'shipping', 'track'],
      customer: ['customer', 'client', 'user'],
      tool: ['tool', 'app', 'platform', 'system'],
      file: ['file', 'document', 'download', 'pdf'],
      announcement: ['announcement', 'news', 'update'],
      knowledge: ['how to', 'guide', 'help', 'process', 'procedure'],
    };

    // Search pages
    pages.forEach(page => {
      const matchScore = calculateMatchScore(lowerQuery, [
        page.name.toLowerCase(),
        ...page.keywords,
      ]);
      if (matchScore > 0.3) {
        searchResults.push({
          id: `page-${page.path}`,
          title: page.name,
          description: `Navigate to ${page.name} page`,
          type: 'page',
          icon: <Home className="h-4 w-4" />,
          action: () => {
            navigate(page.path);
            setIsOpen(false);
            setQuery('');
          },
          badge: 'Page',
        });
      }
    });

    // Search tools
    tools.forEach(tool => {
      const matchScore = calculateMatchScore(lowerQuery, [
        tool.name.toLowerCase(),
        tool.tagline?.toLowerCase() || '',
        tool.description?.toLowerCase() || '',
      ]);
      if (matchScore > 0.2) {
        searchResults.push({
          id: `tool-${tool.id}`,
          title: tool.name,
          description: tool.tagline || tool.description || 'Open this tool',
          type: 'tool',
          icon: <Wrench className="h-4 w-4" />,
          action: () => {
            window.open(tool.url, '_blank');
            setIsOpen(false);
            setQuery('');
          },
          url: tool.url,
          badge: 'Tool',
        });
      }
    });

    // Search knowledge articles
    articles.forEach(article => {
      const matchScore = calculateMatchScore(lowerQuery, [
        article.title.toLowerCase(),
        article.content.toLowerCase(),
      ]);
      if (matchScore > 0.2) {
        searchResults.push({
          id: `article-${article.id}`,
          title: article.title,
          description: article.content.substring(0, 100) + '...',
          type: 'knowledge',
          icon: <BookOpen className="h-4 w-4" />,
          action: () => {
            if (article.category_id) {
              navigate(`/knowledge-base/category/${article.category_id}`);
            } else {
              navigate('/knowledge-base');
            }
            setIsOpen(false);
            setQuery('');
          },
          badge: 'Knowledge',
        });
      }
    });

    // Search announcements
    announcements.forEach(announcement => {
      const matchScore = calculateMatchScore(lowerQuery, [
        announcement.title.toLowerCase(),
        announcement.message.toLowerCase(),
        announcement.content?.toLowerCase() || '',
      ]);
      if (matchScore > 0.2) {
        searchResults.push({
          id: `announcement-${announcement.id}`,
          title: announcement.title,
          description: announcement.message,
          type: 'announcement',
          icon: <Megaphone className="h-4 w-4" />,
          action: () => {
            navigate(`/announcements/${announcement.id}`);
            setIsOpen(false);
            setQuery('');
          },
          badge: 'Announcement',
        });
      }
    });

    // Search files
    files.forEach(file => {
      const matchScore = calculateMatchScore(lowerQuery, [
        file.name.toLowerCase(),
        file.file_type.toLowerCase(),
        file.category?.toLowerCase() || '',
      ]);
      if (matchScore > 0.2) {
        searchResults.push({
          id: `file-${file.id}`,
          title: file.name,
          description: `${file.file_type.toUpperCase()} file - ${(file.file_size / 1024).toFixed(1)} KB`,
          type: 'file',
          icon: <FileText className="h-4 w-4" />,
          action: () => {
            window.open(file.file_url, '_blank');
            setIsOpen(false);
            setQuery('');
          },
          url: file.file_url,
          badge: 'File',
        });
      }
    });

    // Intent-based suggestions
    if (intentKeywords.complaint.some(kw => lowerQuery.includes(kw))) {
      searchResults.unshift({
        id: 'intent-ai-assistant',
        title: 'AI Complaint Assistant',
        description: 'Generate professional complaint tickets with AI assistance',
        type: 'page',
        icon: <Sparkles className="h-4 w-4 text-[#F6B600]" />,
        action: () => {
          navigate('/ai-assistant');
          setIsOpen(false);
          setQuery('');
        },
        badge: 'AI Suggestion',
      });
    }

    // Sort by relevance (type priority + match score)
    searchResults.sort((a, b) => {
      const typePriority = { page: 1, tool: 2, knowledge: 3, announcement: 4, file: 5 };
      return typePriority[a.type] - typePriority[b.type];
    });

    setResults(searchResults.slice(0, 8)); // Limit to top 8 results
    setIsSearching(false);
  };

  const calculateMatchScore = (query: string, targets: string[]): number => {
    let maxScore = 0;
    const queryWords = query.split(' ').filter(w => w.length > 2);

    targets.forEach(target => {
      let score = 0;
      
      // Exact match
      if (target.includes(query)) {
        score += 1.0;
      }

      // Word matches
      queryWords.forEach(word => {
        if (target.includes(word)) {
          score += 0.5;
        }
      });

      // Fuzzy match (starts with)
      queryWords.forEach(word => {
        const targetWords = target.split(' ');
        targetWords.forEach(targetWord => {
          if (targetWord.startsWith(word)) {
            score += 0.3;
          }
        });
      });

      maxScore = Math.max(maxScore, score);
    });

    return maxScore;
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeLabels = {
    page: 'Pages',
    tool: 'Tools',
    knowledge: 'Knowledge Base',
    announcement: 'Announcements',
    file: 'Files',
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F6B600]" />
        <Input
          type="search"
          placeholder={t('global.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          className="w-full pl-10 pr-4 py-2 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-full focus:bg-white/15 focus:border-[#F6B600] focus:ring-2 focus:ring-[#F6B600]/50 transition-all"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#F6B600] animate-spin" />
        )}
      </div>

      {/* AI Results Panel */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-gradient-to-br from-[#4B0F0F] to-[#6A1B2C] border border-white/20 rounded-lg shadow-2xl overflow-hidden z-50">
          <div className="p-3 border-b border-white/10 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#F6B600]" />
            <span className="text-sm font-semibold text-white">AI Search Results</span>
            <Badge variant="secondary" className="ml-auto bg-[#F6B600]/20 text-[#F6B600] border-[#F6B600]/30">
              {results.length} found
            </Badge>
          </div>

          <ScrollArea className="max-h-[400px]">
            <div className="p-2">
              {Object.entries(groupedResults).map(([type, typeResults]) => (
                <div key={type} className="mb-3">
                  <div className="px-3 py-1 text-xs font-semibold text-white/50 uppercase tracking-wider">
                    {typeLabels[type as keyof typeof typeLabels]}
                  </div>
                  <div className="space-y-1">
                    {typeResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={result.action}
                        className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1 text-[#F6B600]">
                            {result.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-white truncate">
                                {result.title}
                              </h4>
                              {result.badge && (
                                <Badge variant="outline" className="text-xs bg-white/5 border-white/20 text-white/70">
                                  {result.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-white/60 line-clamp-2">
                              {result.description}
                            </p>
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {result.url ? (
                              <ExternalLink className="h-4 w-4 text-[#F6B600]" />
                            ) : (
                              <ArrowRight className="h-4 w-4 text-[#F6B600]" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-white/10 bg-black/20">
            <p className="text-xs text-white/50 text-center">
              Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/70">Enter</kbd> to navigate or click on any result
            </p>
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && results.length === 0 && query && !isSearching && (
        <div className="absolute top-full mt-2 w-full bg-gradient-to-br from-[#4B0F0F] to-[#6A1B2C] border border-white/20 rounded-lg shadow-2xl overflow-hidden z-50 p-6 text-center">
          <Sparkles className="h-12 w-12 text-[#F6B600]/50 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-white mb-2">No results found</h4>
          <p className="text-xs text-white/60 mb-4">
            Try searching for tools, knowledge articles, files, or announcements
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuery('complaint process')}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              Complaint process
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuery('delivery tracking')}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              Delivery tracking
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuery('customer tools')}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              Customer tools
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
