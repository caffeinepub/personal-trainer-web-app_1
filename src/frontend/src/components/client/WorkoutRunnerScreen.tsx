import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Timer,
  Dumbbell,
  ArrowLeft,
} from 'lucide-react';
import type { Workout } from '../../backend';
import { useCountdownTimer } from '../../hooks/useCountdownTimer';
import { hasPerSetWeights, formatSetWeights } from '../../utils/workoutSetWeights';

interface WorkoutRunnerScreenProps {
  workout: Workout;
  onExit: () => void;
}

export default function WorkoutRunnerScreen({
  workout,
  onExit,
}: WorkoutRunnerScreenProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // Get rest time with default of 60 seconds
  const currentExercise = workout.exercises[currentExerciseIndex];
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

  // Reset timer when exercise changes
  useEffect(() => {
    reset();
  }, [currentExerciseIndex, reset]);

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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exercise = workout.exercises[currentExerciseIndex];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onExit}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{workout.name}</h1>
              <p className="text-xs text-muted-foreground">
                Exercise {currentExerciseIndex + 1} of {totalExercises}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onExit}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Exit
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {/* Current Exercise Details */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm p-6">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-3">
                    <Dumbbell className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold">{exercise.name}</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-lg border border-border/50 bg-muted/30 p-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Sets</p>
                    <p className="text-3xl font-bold">{exercise.sets.toString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Repetitions</p>
                    <p className="text-3xl font-bold">{exercise.repetitions.toString()}</p>
                  </div>
                </div>

                {/* Weight Information */}
                <div className="rounded-lg border border-border/50 bg-card/50 p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Target Weight</p>
                  {hasPerSetWeights(exercise.setWeights) ? (
                    <p className="text-sm">{formatSetWeights(exercise.setWeights)}</p>
                  ) : (
                    <p className="text-xl font-semibold">
                      {exercise.setWeights?.[0] ? Number(exercise.setWeights[0]) : 0} kg
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Timer Section */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-2">
                  <Timer className="h-6 w-6 text-primary" />
                  <p className="text-lg font-medium text-muted-foreground">Rest Timer</p>
                </div>
                
                <div className="text-center">
                  <p className="text-7xl font-bold tabular-nums tracking-tight">
                    {formatTime(remainingSeconds)}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={isRunning ? pause : start}
                    size="lg"
                    className="gap-2 px-8"
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
                    className="gap-2 px-8"
                  >
                    <RotateCcw className="h-5 w-5" />
                    Reset
                  </Button>
                </div>
              </div>
            </Card>

            {/* Exercise List Overview */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Workout Overview</h3>
                <ScrollArea className="max-h-80">
                  <div className="space-y-2 pr-4">
                    {workout.exercises.map((ex, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg border p-4 transition-all ${
                          idx === currentExerciseIndex
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-border/50 bg-card/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                              idx === currentExerciseIndex 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className={`font-medium ${
                              idx === currentExerciseIndex ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {ex.name}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {ex.sets.toString()} × {ex.repetitions.toString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Separator />

      {/* Navigation Footer */}
      <footer className="border-t border-border/40 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <Button
              onClick={handlePrevious}
              disabled={currentExerciseIndex === 0}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <ChevronLeft className="h-5 w-5" />
              Previous
            </Button>

            <Button
              onClick={onExit}
              variant="secondary"
              size="lg"
            >
              Finish Workout
            </Button>

            <Button
              onClick={handleNext}
              disabled={currentExerciseIndex === totalExercises - 1}
              size="lg"
              className="gap-2"
            >
              Next
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
