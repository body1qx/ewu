import { Search, Filter, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { BranchStatus } from '@/types/types';

interface SearchAndFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  status: BranchStatus | 'all';
  onStatusChange: (value: BranchStatus | 'all') => void;
  hasDriveThru: boolean | 'all';
  onDriveThruChange: (value: boolean | 'all') => void;
  isFranchise: boolean | 'all';
  onFranchiseChange: (value: boolean | 'all') => void;
  is24Hours: boolean | 'all';
  on24HoursChange: (value: boolean | 'all') => void;
  cities: string[];
  onReset: () => void;
}

export function SearchAndFilters({
  search,
  onSearchChange,
  city,
  onCityChange,
  status,
  onStatusChange,
  hasDriveThru,
  onDriveThruChange,
  isFranchise,
  onFranchiseChange,
  is24Hours,
  on24HoursChange,
  cities,
  onReset,
}: SearchAndFiltersProps) {
  const { t } = useTranslation();
  const hasActiveFilters = city !== 'all' || status !== 'all' || hasDriveThru !== 'all' || isFranchise !== 'all' || is24Hours !== 'all' || search !== '';

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder={t('branches.searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-12 text-base bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary transition-all"
          dir="rtl"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground" dir="rtl">{t('global.filter')}</span>
        </div>

        <Select value={city} onValueChange={onCityChange}>
          <SelectTrigger className="w-[180px] bg-card/50 backdrop-blur-sm border-border/50">
            <SelectValue placeholder={t('branches.allCities')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('branches.allCities')}</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => onStatusChange(v as BranchStatus | 'all')}>
          <SelectTrigger className="w-[200px] bg-card/50 backdrop-blur-sm border-border/50">
            <SelectValue placeholder={t('branches.allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('branches.allStatuses')}</SelectItem>
            <SelectItem value="open">{t('branches.status.open')}</SelectItem>
            <SelectItem value="temporarily_closed">{t('branches.status.temporarily_closed')}</SelectItem>
            <SelectItem value="under_renovation">{t('branches.status.under_renovation')}</SelectItem>
            <SelectItem value="permanent_closed">{t('branches.status.permanent_closed')}</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={hasDriveThru === 'all' ? 'all' : hasDriveThru ? 'yes' : 'no'} 
          onValueChange={(v) => onDriveThruChange(v === 'all' ? 'all' : v === 'yes')}
        >
          <SelectTrigger className="w-[180px] bg-card/50 backdrop-blur-sm border-border/50">
            <SelectValue placeholder={t('branches.filters.driveThru', 'درايف ثرو')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('branches.filters.allBranches', 'كل الفروع')}</SelectItem>
            <SelectItem value="yes">{t('branches.filters.withDriveThru', 'فيه درايف ثرو')}</SelectItem>
            <SelectItem value="no">{t('branches.filters.withoutDriveThru', 'بدون درايف ثرو')}</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={isFranchise === 'all' ? 'all' : isFranchise ? 'yes' : 'no'} 
          onValueChange={(v) => onFranchiseChange(v === 'all' ? 'all' : v === 'yes')}
        >
          <SelectTrigger className="w-[180px] bg-card/50 backdrop-blur-sm border-border/50">
            <SelectValue placeholder={t('branches.filters.branchType', 'نوع الفرع')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('branches.filters.allTypes', 'كل الأنواع')}</SelectItem>
            <SelectItem value="yes">{t('branches.filters.franchise', 'فرنشايز')}</SelectItem>
            <SelectItem value="no">{t('branches.filters.companyOwned', 'ملك الشركة')}</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={is24Hours === 'all' ? 'all' : is24Hours ? 'yes' : 'no'} 
          onValueChange={(v) => on24HoursChange(v === 'all' ? 'all' : v === 'yes')}
        >
          <SelectTrigger className="w-[180px] bg-card/50 backdrop-blur-sm border-border/50">
            <SelectValue placeholder={t('branches.filters.operatingHours', 'ساعات العمل')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('branches.filters.allHours', 'كل الأوقات')}</SelectItem>
            <SelectItem value="yes">{t('branches.filters.24hours', '٢٤ ساعة')}</SelectItem>
            <SelectItem value="no">{t('branches.filters.regularHours', 'دوام عادي')}</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            <span dir="rtl">{t('branches.filters.clearFilters', 'امسح الفلاتر')}</span>
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {search && (
            <Badge variant="secondary" className="gap-1">
              Search: {search}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => onSearchChange('')}
              />
            </Badge>
          )}
          {city !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              City: {city}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => onCityChange('all')}
              />
            </Badge>
          )}
          {status !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {status.replace(/_/g, ' ')}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => onStatusChange('all')}
              />
            </Badge>
          )}
          {hasDriveThru !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {hasDriveThru ? 'With' : 'Without'} Drive-Thru
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => onDriveThruChange('all')}
              />
            </Badge>
          )}
          {isFranchise !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {isFranchise ? 'Franchise' : 'Company-Owned'}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => onFranchiseChange('all')}
              />
            </Badge>
          )}
          {is24Hours !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {is24Hours ? '24 Hours' : 'Regular Hours'}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => on24HoursChange('all')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
