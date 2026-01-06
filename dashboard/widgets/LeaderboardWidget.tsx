import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, TrendingUp, Star, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LeaderboardWidgetConfig } from '@/types/types';

interface LeaderboardWidgetProps {
  title: string;
  config: LeaderboardWidgetConfig;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  rank: number;
  change?: number; // Position change from previous period
  badge?: string;
}

export default function LeaderboardWidget({ title, config }: LeaderboardWidgetProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    // Parse entries from config
    if (config.entries && Array.isArray(config.entries)) {
      const sortedEntries = [...config.entries]
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));
      setEntries(sortedEntries);
    }
  }, [config.entries]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const maxEntries = config.max_entries || 10;
  const displayEntries = entries.slice(0, maxEntries);

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          {config.period && (
            <Badge variant="outline" className="text-xs">
              {config.period}
            </Badge>
          )}
        </div>
        {config.subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{config.subtitle}</p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {displayEntries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No leaderboard data available</p>
            </div>
          ) : (
            displayEntries.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  'flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors',
                  entry.rank <= 3 && 'bg-muted/30'
                )}
              >
                {/* Rank Badge */}
                <div className="flex-shrink-0 w-12 flex items-center justify-center">
                  {entry.rank <= 3 ? (
                    <div className="relative">
                      {getRankIcon(entry.rank)}
                      <div
                        className={cn(
                          'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                          getRankBadgeColor(entry.rank)
                        )}
                      >
                        {entry.rank}
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                        getRankBadgeColor(entry.rank)
                      )}
                    >
                      {entry.rank}
                    </div>
                  )}
                </div>

                {/* Avatar & Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="w-10 h-10 border-2 border-background">
                    {entry.avatar ? (
                      <AvatarImage src={entry.avatar} alt={entry.name} />
                    ) : null}
                    <AvatarFallback className="text-sm font-semibold">
                      {getInitials(entry.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{entry.name}</p>
                    {entry.badge && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {entry.badge}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-3">
                  {entry.change !== undefined && entry.change !== 0 && (
                    <div
                      className={cn(
                        'flex items-center gap-1 text-xs font-medium',
                        entry.change > 0 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      <TrendingUp
                        className={cn(
                          'w-3 h-3',
                          entry.change < 0 && 'rotate-180'
                        )}
                      />
                      {Math.abs(entry.change)}
                    </div>
                  )}
                  <div className="text-right">
                    <div className="text-xl font-bold" style={{ color: config.score_color || '#3b82f6' }}>
                      {entry.score.toLocaleString()}
                    </div>
                    {config.score_unit && (
                      <div className="text-xs text-muted-foreground">
                        {config.score_unit}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Stats */}
        {config.show_stats && entries.length > 0 && (
          <div className="border-t p-4 bg-muted/30">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total</div>
                <div className="text-lg font-semibold">{entries.length}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Avg Score</div>
                <div className="text-lg font-semibold">
                  {Math.round(
                    entries.reduce((sum, e) => sum + e.score, 0) / entries.length
                  ).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Top Score</div>
                <div className="text-lg font-semibold text-primary">
                  {entries[0]?.score.toLocaleString() || 0}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
