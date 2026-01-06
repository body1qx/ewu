import { Search, Grid3x3, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { FileCategory, FileType, FileSortOption, FileViewMode } from '@/types/types';

interface FileFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: FileCategory | 'All';
  onCategoryChange: (value: FileCategory | 'All') => void;
  fileType: FileType | 'all';
  onFileTypeChange: (value: FileType | 'all') => void;
  sortBy: FileSortOption;
  onSortChange: (value: FileSortOption) => void;
  viewMode: FileViewMode;
  onViewModeChange: (mode: FileViewMode) => void;
}

const categories: (FileCategory | 'All')[] = ['All', 'Reports', 'Training', 'Policies', 'Templates', 'Other'];

export default function FileFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  fileType,
  onFileTypeChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: FileFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files by name or tags..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={fileType} onValueChange={(value) => onFileTypeChange(value as FileType | 'all')}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => onSortChange(value as FileSortOption)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name_asc">Name A-Z</SelectItem>
              <SelectItem value="name_desc">Name Z-A</SelectItem>
              <SelectItem value="size_asc">Size (Small)</SelectItem>
              <SelectItem value="size_desc">Size (Large)</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="rounded-r-none"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('table')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant={category === cat ? 'default' : 'outline'}
            className="cursor-pointer transition-all hover:scale-105"
            onClick={() => onCategoryChange(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>
    </div>
  );
}
