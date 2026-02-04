import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useCreateWorkout } from '../../hooks/useQueries';
import type { Exercise } from '../../backend';
import { normalizeSetWeights, validateSetWeights, convertSetWeightsToBigInt } from '../../utils/workoutSetWeights';

interface WorkoutBuilderProps {
  clientUsername: string;
  onSuccess: () => void;
}

interface ExerciseForm {
  name: string;
  muscleGroup: string;
  sets: string;
  repetitions: string;
  setWeights: string[]; // Array of weights, one per set
}

export default function WorkoutBuilder({ clientUsername, onSuccess }: WorkoutBuilderProps) {
  const [workoutName, setWorkoutName] = useState('');
  const [comments, setComments] = useState('');
  const [exercises, setExercises] = useState<ExerciseForm[]>([
    { name: '', muscleGroup: '', sets: '', repetitions: '', setWeights: [] }
  ]);
  const [error, setError] = useState('');

  const createWorkoutMutation = useCreateWorkout();

  const handleAddExercise = () => {
    setExercises([...exercises, { name: '', muscleGroup: '', sets: '', repetitions: '', setWeights: [] }]);
  };

  const handleRemoveExercise = (index: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index));
    }
  };

  const handleExerciseChange = (index: number, field: keyof Omit<ExerciseForm, 'setWeights'>, value: string) => {
    const updated = [...exercises];
    
    if (field === 'sets') {
      // When sets change, normalize the setWeights array
      const newSetCount = parseInt(value) || 0;
      if (newSetCount > 0) {
        updated[index].setWeights = normalizeSetWeights(updated[index].setWeights, newSetCount);
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
      
      // Validate per-set weights
      const weightError = validateSetWeights(ex.setWeights, `Exercise ${i + 1}`);
      if (weightError) {
        setError(weightError);
        return;
      }
    }

    // Build exercises array with muscle group in name
    const backendExercises: Exercise[] = exercises.map(ex => ({
      name: `${ex.name} (${ex.muscleGroup})`,
      sets: BigInt(parseInt(ex.sets)),
      repetitions: BigInt(parseInt(ex.repetitions)),
      setWeights: convertSetWeightsToBigInt(ex.setWeights),
    }));

    try {
      await createWorkoutMutation.mutateAsync({
        clientUsername,
        name: workoutName.trim(),
        exercises: backendExercises,
        comments: comments.trim(),
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to create workout. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Workout Details */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="workoutName">Workout Name *</Label>
          <Input
            id="workoutName"
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="e.g., Upper Body Strength"
            disabled={createWorkoutMutation.isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="comments">Notes / Instructions</Label>
          <Textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add any notes or instructions for this workout..."
            disabled={createWorkoutMutation.isPending}
            rows={3}
          />
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Exercises *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddExercise}
            disabled={createWorkoutMutation.isPending}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Exercise
          </Button>
        </div>

        <div className="space-y-3">
          {exercises.map((exercise, index) => {
            const setCount = parseInt(exercise.sets) || 0;
            
            return (
              <Card key={index} className="border-border/50 bg-muted/30">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Exercise {index + 1}</p>
                      {exercises.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExercise(index)}
                          disabled={createWorkoutMutation.isPending}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor={`exercise-name-${index}`} className="text-xs">Exercise Name *</Label>
                        <Input
                          id={`exercise-name-${index}`}
                          type="text"
                          value={exercise.name}
                          onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                          placeholder="e.g., Bench Press"
                          disabled={createWorkoutMutation.isPending}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`exercise-muscle-${index}`} className="text-xs">Muscle Group *</Label>
                        <Input
                          id={`exercise-muscle-${index}`}
                          type="text"
                          value={exercise.muscleGroup}
                          onChange={(e) => handleExerciseChange(index, 'muscleGroup', e.target.value)}
                          placeholder="e.g., Chest"
                          disabled={createWorkoutMutation.isPending}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor={`exercise-sets-${index}`} className="text-xs">Sets *</Label>
                        <Input
                          id={`exercise-sets-${index}`}
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => handleExerciseChange(index, 'sets', e.target.value)}
                          placeholder="3"
                          disabled={createWorkoutMutation.isPending}
                          min="1"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`exercise-reps-${index}`} className="text-xs">Reps *</Label>
                        <Input
                          id={`exercise-reps-${index}`}
                          type="number"
                          value={exercise.repetitions}
                          onChange={(e) => handleExerciseChange(index, 'repetitions', e.target.value)}
                          placeholder="10"
                          disabled={createWorkoutMutation.isPending}
                          min="1"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Per-Set Weight Inputs */}
                    {setCount > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs">Target Weight per Set (kg) *</Label>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {Array.from({ length: setCount }).map((_, setIdx) => (
                            <div key={setIdx}>
                              <Label htmlFor={`exercise-${index}-set-${setIdx}`} className="text-xs text-muted-foreground">
                                Set {setIdx + 1}
                              </Label>
                              <Input
                                id={`exercise-${index}-set-${setIdx}`}
                                type="number"
                                value={exercise.setWeights[setIdx] || ''}
                                onChange={(e) => handleSetWeightChange(index, setIdx, e.target.value)}
                                placeholder="kg"
                                disabled={createWorkoutMutation.isPending}
                                min="0"
                                step="0.5"
                                className="mt-1"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
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
        disabled={createWorkoutMutation.isPending}
        className="w-full"
      >
        {createWorkoutMutation.isPending ? (
          <>
            <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Creating Workout...
          </>
        ) : (
          'Create Workout'
        )}
      </Button>
    </div>
  );
}
