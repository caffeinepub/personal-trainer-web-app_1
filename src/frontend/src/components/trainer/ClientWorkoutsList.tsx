import type { Workout } from '../../backend';
import { Card, CardContent } from '@/components/ui/card';
import { Dumbbell } from 'lucide-react';
import { hasPerSetWeights, formatSetWeights } from '../../utils/workoutSetWeights';

interface ClientWorkoutsListProps {
  workouts: Workout[];
}

export default function ClientWorkoutsList({ workouts }: ClientWorkoutsListProps) {
  if (workouts.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border/50">
        <div className="text-center">
          <Dumbbell className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No workouts created yet. Click "Create Workout" to get started!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {workouts.map((workout, index) => (
        <Card key={index} className="border-border/50 bg-muted/30">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold">{workout.name}</h3>
                {workout.comments && (
                  <p className="mt-1 text-sm text-muted-foreground">{workout.comments}</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Exercises ({workout.exercises.length})</p>
                <div className="space-y-2">
                  {workout.exercises.map((exercise, exIndex) => {
                    const hasSetWeights = hasPerSetWeights(exercise.setWeights);
                    
                    return (
                      <div
                        key={exIndex}
                        className="rounded-lg border border-border/30 bg-background/50 p-3 space-y-1"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{exercise.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {Number(exercise.sets)} sets × {Number(exercise.repetitions)} reps
                            </p>
                          </div>
                          {!hasSetWeights && (
                            <div className="text-right">
                              <p className="font-semibold">{exercise.setWeights?.[0] ? Number(exercise.setWeights[0]) : 0} kg</p>
                            </div>
                          )}
                        </div>
                        {hasSetWeights && (
                          <p className="text-xs text-muted-foreground pt-1">
                            {formatSetWeights(exercise.setWeights)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
