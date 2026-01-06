import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  category: string;
  excerpt: string;
}

interface KnowledgeSearchBarProps {
  onSearch?: (query: string) => void;
  results?: SearchResult[];
}

export default function KnowledgeSearchBar({ onSearch, results = [] }: KnowledgeSearchBarProps) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length > 0 && onSearch) {
      const debounce = setTimeout(() => {
        onSearch(query);
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    setShowResults(false);
  };

  const handleResultClick = (articleId: string) => {
    navigate(`/knowledge-base/article/${articleId}`);
    setShowResults(false);
    setQuery('');
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div
        className={`relative glass-card rounded-ios shadow-soft-md transition-all duration-300 ${
          isFocused ? 'shadow-soft-xl scale-105' : ''
        }`}
      >
        <div className="flex items-center px-4 py-3">
          <Search className={`h-5 w-5 transition-colors duration-300 ${isFocused ? 'text-accent' : 'text-muted-foreground'}`} />
          <Input
            type="text"
            placeholder="Search knowledge base..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(e.target.value.length > 0);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
          />
          {query && (
            <button
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-muted/50 transition-colors duration-200 ios-tap-feedback"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {showResults && results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full glass-card rounded-ios shadow-soft-xl border-0 overflow-hidden animate-slide-up-fade z-50">
          <div className="max-h-96 overflow-y-auto momentum-scroll">
            {results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => handleResultClick(result.id)}
                className="w-full text-left p-4 hover:bg-muted/30 transition-colors duration-200 border-b border-border/50 last:border-0 ios-tap-feedback"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-semibold text-foreground line-clamp-1">
                    {result.title}
                  </h4>
                  <span className="text-xs text-accent font-medium ml-2 whitespace-nowrap">
                    {result.category}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {result.excerpt}
                </p>
              </button>
            ))}
          </div>
        </Card>
      )}

      {showResults && query.length > 0 && results.length === 0 && (
        <Card className="absolute top-full mt-2 w-full glass-card rounded-ios shadow-soft-xl border-0 p-6 text-center animate-slide-up-fade">
          <p className="text-muted-foreground">No results found for "{query}"</p>
        </Card>
      )}
    </div>
  );
}
