import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Dumbbell, Save, AlertCircle, Play } from 'lucide-react';
import type { Workout, WorkoutLog, ExerciseLog } from '../../backend';
import { hasPerSetWeights, formatSetWeights } from '../../utils/workoutSetWeights';

interface CompilableAssignedWorkoutCardProps {
  workout: Workout;
  clientUsername: string;
  onSave: (log: WorkoutLog, workoutId: string) => Promise<void>;
  isSaving: boolean;
  onStart?: (workout: Workout) => void;
}

export default function CompilableAssignedWorkoutCard({
  workout,
  clientUsername,
  onSave,
  isSaving,
  onStart,
}: CompilableAssignedWorkoutCardProps) {
  const [exerciseValues, setExerciseValues] = useState<Record<number, { actualSets: string; actualReps: string; actualWeight: string }>>(
    workout.exercises.reduce((acc, _, idx) => {
      acc[idx] = { actualSets: '', actualReps: '', actualWeight: '' };
      return acc;
    }, {} as Record<number, { actualSets: string; actualReps: string; actualWeight: string }>)
  );
  const [clientNotes, setClientNotes] = useState('');
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');

  const handleExerciseChange = (index: number, field: 'actualSets' | 'actualReps' | 'actualWeight', value: string) => {
    setExerciseValues(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value,
      },
    }));
  };

  const validateAndSave = async () => {
    setError('');

    // Validate all exercises have values
    for (let i = 0; i < workout.exercises.length; i++) {
      const values = exerciseValues[i];
      
      if (!values.actualSets || !values.actualReps || !values.actualWeight) {
        setError('Please fill in all exercise fields (sets, reps, and weight).');
        return;
      }

      const sets = parseInt(values.actualSets);
      const reps = parseInt(values.actualReps);
      const weight = parseInt(values.actualWeight);

      if (isNaN(sets) || sets <= 0) {
        setError(`Invalid sets value for ${workout.exercises[i].name}. Must be a positive number.`);
        return;
      }

      if (isNaN(reps) || reps <= 0) {
        setError(`Invalid reps value for ${workout.exercises[i].name}. Must be a positive number.`);
        return;
      }

      if (isNaN(weight) || weight < 0) {
        setError(`Invalid weight value for ${workout.exercises[i].name}. Must be a non-negative number.`);
        return;
      }
    }

    // Build exercise logs
    const exerciseLogs: ExerciseLog[] = workout.exercises.map((exercise, idx) => {
      const values = exerciseValues[idx];
      const actualSetsCount = parseInt(values.actualSets);
      
      return {
        name: exercise.name,
        sets: exercise.sets,
        repetitions: exercise.repetitions,
        setWeights: exercise.setWeights || [],
        actualSets: BigInt(actualSetsCount),
        actualRepetitions: BigInt(parseInt(values.actualReps)),
        actualSetWeights: Array(actualSetsCount).fill(BigInt(parseInt(values.actualWeight))),
        restTime: exercise.restTime || BigInt(60),
      };
    });

    const log: WorkoutLog = {
      workoutName: workout.name,
      clientUsername,
      exercises: exerciseLogs,
      comments: workout.comments,
      completed,
      date: new Date().toISOString().split('T')[0],
      clientNotes: clientNotes.trim() || undefined,
    };

    try {
      await onSave(log, `${workout.name}-${Date.now()}`);
      // Reset form on success
      setExerciseValues(
        workout.exercises.reduce((acc, _, idx) => {
          acc[idx] = { actualSets: '', actualReps: '', actualWeight: '' };
          return acc;
        }, {} as Record<number, { actualSets: string; actualReps: string; actualWeight: string }>)
      );
      setClientNotes('');
      setCompleted(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save workout log. Please try again.');
    }
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-2">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>{workout.name}</CardTitle>
              <CardDescription>Assigned by your trainer</CardDescription>
            </div>
          </div>
          {onStart && (
            <Button
              onClick={() => onStart(workout)}
              variant="default"
              size="sm"
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Start
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {workout.comments && (
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Trainer notes:</span> {workout.comments}
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {workout.exercises.map((exercise, idx) => {
            const hasSetWeights = hasPerSetWeights(exercise.setWeights);
            const restTimeDisplay = exercise.restTime ? `${Number(exercise.restTime)}s` : '60s';
            
            return (
              <div key={idx} className="rounded-lg border border-border/50 bg-card/50 p-4 space-y-3">
                <div className="space-y-1">
                  <h4 className="font-semibold">{exercise.name}</h4>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    <p>Target: {exercise.sets.toString()} sets × {exercise.repetitions.toString()} reps</p>
                    {hasSetWeights ? (
                      <p className="text-xs">{formatSetWeights(exercise.setWeights)}</p>
                    ) : (
                      <p>Weight: {exercise.setWeights?.[0] ? Number(exercise.setWeights[0]) : 0}kg</p>
                    )}
                    <p className="text-xs">Rest: {restTimeDisplay}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`sets-${idx}`} className="text-xs">
                      Actual Sets
                    </Label>
                    <Input
                      id={`sets-${idx}`}
                      type="number"
                      placeholder="e.g., 3"
                      value={exerciseValues[idx]?.actualSets || ''}
                      onChange={(e) => handleExerciseChange(idx, 'actualSets', e.target.value)}
                      disabled={isSaving}
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`reps-${idx}`} className="text-xs">
                      Actual Reps
                    </Label>
                    <Input
                      id={`reps-${idx}`}
                      type="number"
                      placeholder="e.g., 10"
                      value={exerciseValues[idx]?.actualReps || ''}
                      onChange={(e) => handleExerciseChange(idx, 'actualReps', e.target.value)}
                      disabled={isSaving}
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`weight-${idx}`} className="text-xs">
                      Actual Weight (kg)
                    </Label>
                    <Input
                      id={`weight-${idx}`}
                      type="number"
                      placeholder="e.g., 60"
                      value={exerciseValues[idx]?.actualWeight || ''}
                      onChange={(e) => handleExerciseChange(idx, 'actualWeight', e.target.value)}
                      disabled={isSaving}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientNotes">Your Notes (optional)</Label>
          <Textarea
            id="clientNotes"
            placeholder="Add any notes about this workout session..."
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            disabled={isSaving}
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3">
          <Label htmlFor="completed" className="cursor-pointer">
            Mark as completed
          </Label>
          <Switch
            id="completed"
            checked={completed}
            onCheckedChange={setCompleted}
            disabled={isSaving}
          />
        </div>

        <Button
          onClick={validateAndSave}
          disabled={isSaving}
          className="w-full gap-2"
        >
          {isSaving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Workout Log
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
