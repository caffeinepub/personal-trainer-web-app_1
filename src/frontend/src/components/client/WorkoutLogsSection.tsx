import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, CheckCircle2, XCircle } from 'lucide-react';
import { useGetWorkoutLogsForClient } from '../../hooks/useQueries';
import { hasPerSetWeights, formatSetWeights } from '../../utils/workoutSetWeights';

interface WorkoutLogsSectionProps {
  username: string;
}

export default function WorkoutLogsSection({ username }: WorkoutLogsSectionProps) {
  const { data: logs, isLoading } = useGetWorkoutLogsForClient(username);

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Workout History
          </CardTitle>
          <CardDescription>Your completed workout logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort logs by date (newest first)
  const sortedLogs = logs ? [...logs].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  }) : [];

  if (!sortedLogs || sortedLogs.length === 0) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Workout History
          </CardTitle>
          <CardDescription>Your completed workout logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border/50">
            <p className="text-sm text-muted-foreground">
              No workout logs yet. Complete an assigned workout to see it here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Workout History
        </CardTitle>
        <CardDescription>Your completed workout logs ({sortedLogs.length} total)</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {sortedLogs.map((log, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border/50 bg-card/50 p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-lg">{log.workoutName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(log.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <Badge
                    variant={log.completed ? 'default' : 'secondary'}
                    className="gap-1"
                  >
                    {log.completed ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Completed
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        Incomplete
                      </>
                    )}
                  </Badge>
                </div>

                {log.comments && (
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Trainer notes:</span> {log.comments}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {log.exercises.map((exercise, exIdx) => {
                    const hasSetWeights = hasPerSetWeights(exercise.setWeights);
                    const hasActualSetWeights = hasPerSetWeights(exercise.actualSetWeights);
                    
                    // Fallback to first weight if no per-set weights
                    const targetWeight = hasSetWeights 
                      ? formatSetWeights(exercise.setWeights)
                      : `${exercise.setWeights?.[0] ? Number(exercise.setWeights[0]) : 0}kg`;
                    
                    const actualWeight = hasActualSetWeights
                      ? formatSetWeights(exercise.actualSetWeights)
                      : `${exercise.actualSetWeights?.[0] ? Number(exercise.actualSetWeights[0]) : 0}kg`;
                    
                    return (
                      <div
                        key={exIdx}
                        className="rounded-md border border-border/30 bg-background/50 p-3 space-y-1"
                      >
                        <span className="font-medium text-sm block">{exercise.name}</span>
                        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                          <span>
                            Target: {exercise.sets.toString()}×{exercise.repetitions.toString()} @ {targetWeight}
                          </span>
                          <span className="text-primary font-medium">
                            Actual: {exercise.actualSets.toString()}×{exercise.actualRepetitions.toString()} @ {actualWeight}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {log.clientNotes && (
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Your notes:</span> {log.clientNotes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
