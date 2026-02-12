import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useCreateClientWorkout, useCreateOwnWorkout, useUpdateWorkout } from '../../hooks/useQueries';
import type { Exercise, Workout } from '../../backend';
import { normalizeSetWeights, validateSetWeights, convertSetWeightsToBigInt } from '../../utils/workoutSetWeights';
import { normalizeRestTimes, validateRestTimes, convertRestTimesToBigInt } from '../../utils/workoutRestTimes';

interface WorkoutBuilderProps {
  clientUsername: string;
  onSuccess: () => void;
  mode?: 'trainer' | 'client' | 'edit';
  existingWorkout?: Workout;
}

interface ExerciseForm {
  name: string;
  muscleGroup: string;
  sets: string;
  repetitions: string;
  setWeights: string[];
  restTimes: string[];
}

export default function WorkoutBuilder({ clientUsername, onSuccess, mode = 'trainer', existingWorkout }: WorkoutBuilderProps) {
  const [workoutName, setWorkoutName] = useState('');
  const [comments, setComments] = useState('');
  const [exercises, setExercises] = useState<ExerciseForm[]>([
    { name: '', muscleGroup: '', sets: '', repetitions: '', setWeights: [], restTimes: [] }
  ]);
  const [error, setError] = useState('');

  const createClientWorkoutMutation = useCreateClientWorkout();
  const createOwnWorkoutMutation = useCreateOwnWorkout();
  const updateWorkoutMutation = useUpdateWorkout();

  // Prefill form when editing
  useEffect(() => {
    if (mode === 'edit' && existingWorkout) {
      setWorkoutName(existingWorkout.name);
      setComments(existingWorkout.comments);
      
      const exerciseForms: ExerciseForm[] = existingWorkout.exercises.map(ex => {
        // Extract name and muscle group from "Name (MuscleGroup)" format
        const match = ex.name.match(/^(.+?)\s*\((.+?)\)$/);
        const name = match ? match[1].trim() : ex.name;
        const muscleGroup = match ? match[2].trim() : '';
        
        const setCount = Number(ex.sets);
        const restTimesArray = ex.restTime ? Array(setCount).fill(ex.restTime.toString()) : Array(setCount).fill('60');
        
        return {
          name,
          muscleGroup,
          sets: ex.sets.toString(),
          repetitions: ex.repetitions.toString(),
          setWeights: ex.setWeights.map(w => w.toString()),
          restTimes: restTimesArray,
        };
      });
      
      setExercises(exerciseForms.length > 0 ? exerciseForms : [{ name: '', muscleGroup: '', sets: '', repetitions: '', setWeights: [], restTimes: [] }]);
    }
  }, [mode, existingWorkout]);

  const handleAddExercise = () => {
    setExercises([...exercises, { name: '', muscleGroup: '', sets: '', repetitions: '', setWeights: [], restTimes: [] }]);
  };

  const handleRemoveExercise = (index: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index));
    }
  };

  const handleExerciseChange = (index: number, field: keyof Omit<ExerciseForm, 'setWeights' | 'restTimes'>, value: string) => {
    const updated = [...exercises];
    
    if (field === 'sets') {
      const newSetCount = parseInt(value) || 0;
      if (newSetCount > 0) {
        updated[index].setWeights = normalizeSetWeights(updated[index].setWeights, newSetCount);
        updated[index].restTimes = normalizeRestTimes(updated[index].restTimes, newSetCount);
      }
      updated[index].sets = value;
    } else {
      updated[index][field] = value;
    }
    
    setExercises(updated);
  };

  const handleSetWeightChange = (exerciseIndex: number, setIndex: number, value: string) => {
    const updated = [...exercises];
    updated[exerciseIndex].setWeights[setIndex] = value;
    setExercises(updated);
  };

  const handleRestTimeChange = (exerciseIndex: number, setIndex: number, value: string) => {
    const updated = [...exercises];
    updated[exerciseIndex].restTimes[setIndex] = value;
    setExercises(updated);
  };

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (!workoutName.trim()) {
      setError('Workout name is required');
      return;
    }

    if (exercises.length === 0) {
      setError('At least one exercise is required');
      return;
    }

    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      if (!ex.name.trim()) {
        setError(`Exercise ${i + 1}: Name is required`);
        return;
      }
      if (!ex.muscleGroup.trim()) {
        setError(`Exercise ${i + 1}: Muscle group is required`);
        return;
      }
      const sets = parseInt(ex.sets);
      if (isNaN(sets) || sets <= 0) {
        setError(`Exercise ${i + 1}: Sets must be a positive number`);
        return;
      }
      const reps = parseInt(ex.repetitions);
      if (isNaN(reps) || reps <= 0) {
        setError(`Exercise ${i + 1}: Repetitions must be a positive number`);
        return;
      }
      
      const weightError = validateSetWeights(ex.setWeights, `Exercise ${i + 1}`);
      if (weightError) {
        setError(weightError);
        return;
      }

      const restTimeError = validateRestTimes(ex.restTimes, `Exercise ${i + 1}`);
      if (restTimeError) {
        setError(restTimeError);
        return;
      }
    }

    try {
      const backendExercises: Exercise[] = exercises.map(ex => {
        const setWeightsBigInt = convertSetWeightsToBigInt(ex.setWeights);
        const restTimesBigInt = convertRestTimesToBigInt(ex.restTimes);
        const avgRestTime = restTimesBigInt.length > 0 
          ? restTimesBigInt.reduce((sum, val) => sum + val, BigInt(0)) / BigInt(restTimesBigInt.length)
          : BigInt(60);

        return {
          name: `${ex.name.trim()} (${ex.muscleGroup.trim()})`,
          sets: BigInt(ex.sets),
          repetitions: BigInt(ex.repetitions),
          setWeights: setWeightsBigInt,
          restTime: avgRestTime,
        };
      });

      if (mode === 'edit' && existingWorkout) {
        const workoutId = `${existingWorkout.clientUsername}_${existingWorkout.name}`;
        await updateWorkoutMutation.mutateAsync({
          workoutId,
          exercises: backendExercises,
          comments: comments.trim(),
          clientUsername,
        });
      } else if (mode === 'client') {
        await createOwnWorkoutMutation.mutateAsync({
          name: workoutName.trim(),
          exercises: backendExercises,
          comments: comments.trim(),
          clientUsername,
        });
      } else {
        await createClientWorkoutMutation.mutateAsync({
          clientUsername,
          name: workoutName.trim(),
          exercises: backendExercises,
          comments: comments.trim(),
        });
      }

      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to save workout. Please try again.');
    }
  };

  const isPending = createClientWorkoutMutation.isPending || createOwnWorkoutMutation.isPending || updateWorkoutMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Workout Name */}
      <div className="space-y-2">
        <Label htmlFor="workoutName">Workout Name</Label>
        <Input
          id="workoutName"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          placeholder="e.g., Upper Body Strength"
          disabled={isPending || mode === 'edit'}
        />
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Exercises</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddExercise}
            disabled={isPending}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Exercise
          </Button>
        </div>

        {exercises.map((exercise, exerciseIndex) => {
          const setCount = parseInt(exercise.sets) || 0;
          
          return (
            <Card key={exerciseIndex} className="border-border/50 bg-muted/30">
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold">Exercise {exerciseIndex + 1}</h4>
                  {exercises.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExercise(exerciseIndex)}
                      disabled={isPending}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`exercise-name-${exerciseIndex}`}>Exercise Name</Label>
                    <Input
                      id={`exercise-name-${exerciseIndex}`}
                      value={exercise.name}
                      onChange={(e) => handleExerciseChange(exerciseIndex, 'name', e.target.value)}
                      placeholder="e.g., Bench Press"
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`muscle-group-${exerciseIndex}`}>Muscle Group</Label>
                    <Input
                      id={`muscle-group-${exerciseIndex}`}
                      value={exercise.muscleGroup}
                      onChange={(e) => handleExerciseChange(exerciseIndex, 'muscleGroup', e.target.value)}
                      placeholder="e.g., Chest"
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`sets-${exerciseIndex}`}>Sets</Label>
                    <Input
                      id={`sets-${exerciseIndex}`}
                      type="number"
                      value={exercise.sets}
                      onChange={(e) => handleExerciseChange(exerciseIndex, 'sets', e.target.value)}
                      placeholder="e.g., 3"
                      min="1"
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`reps-${exerciseIndex}`}>Repetitions</Label>
                    <Input
                      id={`reps-${exerciseIndex}`}
                      type="number"
                      value={exercise.repetitions}
                      onChange={(e) => handleExerciseChange(exerciseIndex, 'repetitions', e.target.value)}
                      placeholder="e.g., 10"
                      min="1"
                      disabled={isPending}
                    />
                  </div>
                </div>

                {setCount > 0 && (
                  <>
                    <div className="space-y-2">
                      <Label>Target Weight per Set (kg)</Label>
                      <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {Array.from({ length: setCount }).map((_, setIndex) => (
                          <Input
                            key={setIndex}
                            type="number"
                            value={exercise.setWeights[setIndex] || ''}
                            onChange={(e) => handleSetWeightChange(exerciseIndex, setIndex, e.target.value)}
                            placeholder={`Set ${setIndex + 1}`}
                            min="0"
                            step="0.5"
                            disabled={isPending}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Rest Time per Set (seconds)</Label>
                      <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {Array.from({ length: setCount }).map((_, setIndex) => (
                          <Input
                            key={setIndex}
                            type="number"
                            value={exercise.restTimes[setIndex] || ''}
                            onChange={(e) => handleRestTimeChange(exerciseIndex, setIndex, e.target.value)}
                            placeholder={`Set ${setIndex + 1}`}
                            min="0"
                            step="5"
                            disabled={isPending}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comments */}
      <div className="space-y-2">
        <Label htmlFor="comments">Comments / Notes (optional)</Label>
        <Textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Add any additional notes or instructions..."
          rows={3}
          disabled={isPending}
        />
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full"
      >
        {isPending ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            {mode === 'edit' ? 'Updating...' : 'Creating...'}
          </>
        ) : (
          <>{mode === 'edit' ? 'Update Workout' : 'Create Workout'}</>
        )}
      </Button>
    </div>
  );
}
