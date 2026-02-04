import { useState } from 'react';
import type { ExercisePerformance } from '../../backend';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

interface ExercisePerformanceProgressionProps {
  data: ExercisePerformance[];
}

export default function ExercisePerformanceProgression({ data }: ExercisePerformanceProgressionProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border/50">
        <p className="text-sm text-muted-foreground">No exercise performance data yet</p>
      </div>
    );
  }

  // Group by exercise name
  const groupedData = data.reduce((acc, entry) => {
    const exerciseName = entry.exercise.name;
    if (!acc[exerciseName]) {
      acc[exerciseName] = [];
    }
    acc[exerciseName].push(entry);
    return acc;
  }, {} as Record<string, ExercisePerformance[]>);

  // Filter by search term
  const filteredExercises = Object.keys(groupedData).filter(name =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search Filter */}
      <div className="space-y-2">
        <Label htmlFor="exerciseSearch">Filter by Exercise</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="exerciseSearch"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search exercises..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Exercise Performance List */}
      <div className="space-y-4">
        {filteredExercises.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border/50">
            <p className="text-sm text-muted-foreground">No exercises match your search</p>
          </div>
        ) : (
          filteredExercises.map((exerciseName) => {
            const entries = groupedData[exerciseName].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );
            const firstEntry = entries[0];
            const lastEntry = entries[entries.length - 1];
            
            // Use first weight from setWeights array for comparison
            const firstWeight = firstEntry.exercise.setWeights?.[0] ? Number(firstEntry.exercise.setWeights[0]) : 0;
            const lastWeight = lastEntry.exercise.setWeights?.[0] ? Number(lastEntry.exercise.setWeights[0]) : 0;
            const weightChange = lastWeight - firstWeight;

            return (
              <div key={exerciseName} className="rounded-lg border border-border/50 bg-muted/30 p-4">
                <h3 className="mb-3 font-semibold">{exerciseName}</h3>
                <div className="mb-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">First Record</p>
                    <p className="text-sm font-medium">
                      {Number(firstEntry.exercise.sets)} × {Number(firstEntry.exercise.repetitions)} @ {firstWeight} kg
                    </p>
                    <p className="text-xs text-muted-foreground">{firstEntry.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Latest Record</p>
                    <p className="text-sm font-medium">
                      {Number(lastEntry.exercise.sets)} × {Number(lastEntry.exercise.repetitions)} @ {lastWeight} kg
                    </p>
                    <p className="text-xs text-muted-foreground">{lastEntry.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Weight Progress</p>
                    <p className={`text-sm font-medium ${weightChange > 0 ? 'text-green-500' : weightChange < 0 ? 'text-red-500' : ''}`}>
                      {weightChange > 0 ? '+' : ''}{weightChange} kg
                    </p>
                    <p className="text-xs text-muted-foreground">{entries.length} entries</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">History</p>
                  <div className="max-h-32 space-y-1 overflow-y-auto">
                    {entries.map((entry, idx) => {
                      const entryWeight = entry.exercise.setWeights?.[0] ? Number(entry.exercise.setWeights[0]) : 0;
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{entry.date}</span>
                          <span>
                            {Number(entry.exercise.sets)}×{Number(entry.exercise.repetitions)} @ {entryWeight}kg
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
