import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface LeaderboardConfigFormProps {
  form: UseFormReturn<any>;
}

export default function LeaderboardConfigForm({ form }: LeaderboardConfigFormProps) {
  const [entries, setEntries] = useState<any[]>(form.watch('config.entries') || []);

  const addEntry = () => {
    const newEntry = {
      id: `entry-${Date.now()}`,
      name: '',
      score: 0,
      change: 0,
      badge: '',
    };
    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    form.setValue('config.entries', updatedEntries);
  };

  const removeEntry = (index: number) => {
    const updatedEntries = entries.filter((_, i) => i !== index);
    setEntries(updatedEntries);
    form.setValue('config.entries', updatedEntries);
  };

  const updateEntry = (index: number, field: string, value: any) => {
    const updatedEntries = [...entries];
    updatedEntries[index] = { ...updatedEntries[index], [field]: value };
    setEntries(updatedEntries);
    form.setValue('config.entries', updatedEntries);
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Period */}
      <FormField
        control={form.control}
        name="config.period"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Period</FormLabel>
            <FormControl>
              <Input placeholder="e.g., This Week, This Month" {...field} />
            </FormControl>
            <FormDescription>Time period for the leaderboard</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Subtitle */}
      <FormField
        control={form.control}
        name="config.subtitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subtitle</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Top performing employees" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Max Entries */}
      <FormField
        control={form.control}
        name="config.max_entries"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Max Entries to Display</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="1"
                max="50"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
              />
            </FormControl>
            <FormDescription>Maximum number of employees to show</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Score Unit */}
      <FormField
        control={form.control}
        name="config.score_unit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Score Unit</FormLabel>
            <FormControl>
              <Input placeholder="e.g., points, tasks, calls" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Score Color */}
      <FormField
        control={form.control}
        name="config.score_color"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Score Color</FormLabel>
            <FormControl>
              <Input type="color" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Show Stats */}
      <FormField
        control={form.control}
        name="config.show_stats"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Show Statistics</FormLabel>
              <FormDescription>
                Display total, average, and top score at the bottom
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Employee Entries */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <FormLabel className="text-base">Employee Entries</FormLabel>
            <FormDescription>Add employees to the leaderboard</FormDescription>
          </div>
          <Button type="button" size="sm" onClick={addEntry} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {entries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No employees added yet</p>
                <p className="text-xs mt-1">Click "Add Employee" to get started</p>
              </CardContent>
            </Card>
          ) : (
            entries.map((entry, index) => (
              <Card key={entry.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar Preview */}
                    <Avatar className="w-12 h-12 mt-2">
                      <AvatarFallback className="text-sm font-semibold">
                        {getInitials(entry.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Form Fields */}
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <FormLabel className="text-xs">Employee Name</FormLabel>
                        <Input
                          placeholder="e.g., Ahmed Al-Rashid"
                          value={entry.name}
                          onChange={(e) => updateEntry(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <FormLabel className="text-xs">Score</FormLabel>
                        <Input
                          type="number"
                          placeholder="0"
                          value={entry.score}
                          onChange={(e) =>
                            updateEntry(index, 'score', parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div>
                        <FormLabel className="text-xs">Change</FormLabel>
                        <Input
                          type="number"
                          placeholder="0"
                          value={entry.change || 0}
                          onChange={(e) =>
                            updateEntry(index, 'change', parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <FormLabel className="text-xs">Badge (Optional)</FormLabel>
                        <Input
                          placeholder="e.g., Top Performer, Rising Star"
                          value={entry.badge || ''}
                          onChange={(e) => updateEntry(index, 'badge', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Delete Button */}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeEntry(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
