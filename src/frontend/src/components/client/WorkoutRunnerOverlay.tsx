import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Timer,
  Dumbbell,
} from 'lucide-react';
import type { Workout } from '../../backend';
import { useCountdownTimer } from '../../hooks/useCountdownTimer';
import { hasPerSetWeights, formatSetWeights } from '../../utils/workoutSetWeights';

interface WorkoutRunnerOverlayProps {
  workout: Workout | null;
  open: boolean;
  onExit: () => void;
}

export default function WorkoutRunnerOverlay({
  workout,
  open,
  onExit,
}: WorkoutRunnerOverlayProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // Get rest time with default of 60 seconds
  const currentExercise = workout?.exercises[currentExerciseIndex];
  const restTimeSeconds = currentExercise?.restTime 
    ? Number(currentExercise.restTime) 
    : 60;

  // Call hook unconditionally at top level
  const {
    remainingSeconds,
    isRunning,
    start,
    pause,
    reset,
  } = useCountdownTimer(restTimeSeconds);

  // Reset exercise index when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentExerciseIndex(0);
    }
  }, [open]);

  // Early return after all hooks
  if (!workout) {
    return null;
  }

  const totalExercises = workout.exercises.length;

  const handleNext = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1);
    }
  };

  const handleExit = () => {
    setCurrentExerciseIndex(0);
    onExit();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exercise = workout.exercises[currentExerciseIndex];

  return (
    <Dialog open={open} onOpenChange={handleExit}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">{workout.name}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExit}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Exercise {currentExerciseIndex + 1} of {totalExercises}
          </p>
        </DialogHeader>

        <Separator />

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            {/* Current Exercise Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-2">
                  <Dumbbell className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">{exercise.name}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-lg border border-border/50 bg-muted/30 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Sets</p>
                  <p className="text-2xl font-bold">{exercise.sets.toString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Repetitions</p>
                  <p className="text-2xl font-bold">{exercise.repetitions.toString()}</p>
                </div>
              </div>

              {/* Weight Information */}
              <div className="rounded-lg border border-border/50 bg-card/50 p-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Target Weight</p>
                {hasPerSetWeights(exercise.setWeights) ? (
                  <p className="text-sm">{formatSetWeights(exercise.setWeights)}</p>
                ) : (
                  <p className="text-lg font-semibold">
                    {exercise.setWeights?.[0] ? Number(exercise.setWeights[0]) : 0}kg
                  </p>
                )}
              </div>

              {/* Timer Section */}
              <div className="rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Timer className="h-5 w-5 text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">Rest Timer</p>
                </div>
                
                <div className="text-center mb-6">
                  <p className="text-6xl font-bold tabular-nums tracking-tight">
                    {formatTime(remainingSeconds)}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={isRunning ? pause : start}
                    size="lg"
                    className="gap-2"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="h-5 w-5" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={reset}
                    variant="outline"
                    size="lg"
                    className="gap-2"
                  >
                    <RotateCcw className="h-5 w-5" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            {/* Exercise List Overview */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Workout Overview</h4>
              <div className="space-y-2">
                {workout.exercises.map((ex, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-3 transition-colors ${
                      idx === currentExerciseIndex
                        ? 'border-primary bg-primary/10'
                        : 'border-border/50 bg-card/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          idx === currentExerciseIndex ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                          {idx + 1}.
                        </span>
                        <span className={`text-sm font-medium ${
                          idx === currentExerciseIndex ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {ex.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {ex.sets.toString()} × {ex.repetitions.toString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <Separator />

        {/* Navigation Footer */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <Button
              onClick={handlePrevious}
              disabled={currentExerciseIndex === 0}
              variant="outline"
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <Button
              onClick={handleExit}
              variant="secondary"
            >
              Finish
            </Button>

            <Button
              onClick={handleNext}
              disabled={currentExerciseIndex === totalExercises - 1}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
