import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';
import { useGetWorkoutsForClient, useLogWorkoutCompletion } from '../../hooks/useQueries';
import CompilableAssignedWorkoutCard from './CompilableAssignedWorkoutCard';
import WorkoutRunnerOverlay from './WorkoutRunnerOverlay';
import type { WorkoutLog, Workout } from '../../backend';

interface AssignedWorkoutsSectionProps {
  username: string;
}

export default function AssignedWorkoutsSection({ username }: AssignedWorkoutsSectionProps) {
  const { data: workouts, isLoading } = useGetWorkoutsForClient(username);
  const logWorkoutMutation = useLogWorkoutCompletion();
  
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [runnerOpen, setRunnerOpen] = useState(false);

  const handleSaveWorkout = async (log: WorkoutLog, workoutId: string) => {
    await logWorkoutMutation.mutateAsync({ log, workoutId });
  };

  const handleStartWorkout = (workout: Workout) => {
    setActiveWorkout(workout);
    setRunnerOpen(true);
  };

  const handleExitRunner = () => {
    setRunnerOpen(false);
    setActiveWorkout(null);
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Assigned Workouts
          </CardTitle>
          <CardDescription>Workouts from your trainer and your own workouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!workouts || workouts.length === 0) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Assigned Workouts
          </CardTitle>
          <CardDescription>Workouts from your trainer and your own workouts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border/50">
            <p className="text-sm text-muted-foreground">
              No workouts yet. Your trainer can create workouts for you, or you can create your own.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight">Assigned Workouts</h2>
          <p className="text-muted-foreground">
            Complete and log your workouts below
          </p>
        </div>

        <div className="space-y-6">
          {workouts.map((workout, idx) => (
            <CompilableAssignedWorkoutCard
              key={idx}
              workout={workout}
              clientUsername={username}
              onSave={handleSaveWorkout}
              isSaving={logWorkoutMutation.isPending}
              onStart={handleStartWorkout}
            />
          ))}
        </div>
      </div>

      <WorkoutRunnerOverlay
        workout={activeWorkout}
        open={runnerOpen}
        onExit={handleExitRunner}
      />
    </>
  );
}
