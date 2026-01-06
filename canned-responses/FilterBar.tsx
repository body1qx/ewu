import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

interface FilterBarProps {
  search: string;
  platform: string;
  category: string;
  language: string;
  tone: string;
  sentiment: string;
  categories: string[];
  onSearchChange: (value: string) => void;
  onPlatformChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onToneChange: (value: string) => void;
  onSentimentChange: (value: string) => void;
}

export default function FilterBar({
  search,
  platform,
  category,
  language,
  tone,
  sentiment,
  categories,
  onSearchChange,
  onPlatformChange,
  onCategoryChange,
  onLanguageChange,
  onToneChange,
  onSentimentChange,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by keyword, category, or tag..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <Select value={platform} onValueChange={onPlatformChange}>
          <SelectTrigger>
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="twitter">Twitter</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="google_reviews">Google Reviews</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={language} onValueChange={onLanguageChange}>
          <SelectTrigger>
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            <SelectItem value="ar">Arabic</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="bilingual">Bilingual</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tone} onValueChange={onToneChange}>
          <SelectTrigger>
            <SelectValue placeholder="Tone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tones</SelectItem>
            <SelectItem value="formal">Formal</SelectItem>
            <SelectItem value="friendly">Friendly</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="apologetic">Apologetic</SelectItem>
            <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sentiment} onValueChange={onSentimentChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sentiment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sentiments</SelectItem>
            <SelectItem value="apology">Apology</SelectItem>
            <SelectItem value="thanks">Thanks</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="follow_up">Follow-up</SelectItem>
            <SelectItem value="greeting">Greeting</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
