import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, User, TrendingUp, Dumbbell, Plus } from 'lucide-react';
import {
  useSetClientHeight,
  useAddBodyWeightEntry,
  useGetBodyWeightHistory,
  useGetExercisePerformanceHistory,
  useGetWorkoutsForClient,
} from '../../hooks/useQueries';
import BodyweightProgressionChart from './BodyweightProgressionChart';
import ExercisePerformanceProgression from './ExercisePerformanceProgression';
import WorkoutBuilder from './WorkoutBuilder';
import ClientWorkoutsList from './ClientWorkoutsList';
import type { Workout } from '../../backend';

interface TrainerClientDetailSectionsProps {
  username: string;
}

export default function TrainerClientDetailSections({ username }: TrainerClientDetailSectionsProps) {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [weightDate, setWeightDate] = useState(new Date().toISOString().split('T')[0]);
  const [heightError, setHeightError] = useState('');
  const [weightError, setWeightError] = useState('');
  const [showWorkoutBuilder, setShowWorkoutBuilder] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  const setHeightMutation = useSetClientHeight();
  const addWeightMutation = useAddBodyWeightEntry();
  const { data: bodyWeightHistory = [], isLoading: bodyWeightLoading, isError: bodyWeightError } = useGetBodyWeightHistory(username);
  const { data: exercisePerformanceHistory = [], isLoading: exercisePerformanceLoading, isError: exercisePerformanceError } = useGetExercisePerformanceHistory(username);
  const { data: workouts = [], isLoading: workoutsLoading, isError: workoutsError } = useGetWorkoutsForClient(username);

  const handleSaveHeight = async () => {
    setHeightError('');
    
    const heightNum = parseFloat(height);
    if (!height || isNaN(heightNum) || heightNum <= 0) {
      setHeightError('Please enter a valid height (positive number)');
      return;
    }

    try {
      await setHeightMutation.mutateAsync({ username, height: BigInt(Math.round(heightNum)) });
      setHeight('');
    } catch (err: any) {
      setHeightError(err?.message || 'Failed to save height. Please try again.');
    }
  };

  const handleAddWeight = async () => {
    setWeightError('');
    
    const weightNum = parseFloat(weight);
    if (!weight || isNaN(weightNum) || weightNum <= 0) {
      setWeightError('Please enter a valid weight (positive number)');
      return;
    }

    if (!weightDate) {
      setWeightError('Please select a date');
      return;
    }

    try {
      await addWeightMutation.mutateAsync({ username, weight: BigInt(Math.round(weightNum)), date: weightDate });
      setWeight('');
      setWeightDate(new Date().toISOString().split('T')[0]);
    } catch (err: any) {
      setWeightError(err?.message || 'Failed to add weight entry. Please try again.');
    }
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
    setShowWorkoutBuilder(true);
  };

  const handleCloseBuilder = () => {
    setShowWorkoutBuilder(false);
    setEditingWorkout(null);
  };

  const latestWeight = bodyWeightHistory.length > 0 
    ? bodyWeightHistory[bodyWeightHistory.length - 1] 
    : null;

  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="info" className="gap-2">
          <User className="h-4 w-4" />
          Client Info
        </TabsTrigger>
        <TabsTrigger value="progressions" className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Progressions
        </TabsTrigger>
        <TabsTrigger value="workouts" className="gap-2">
          <Dumbbell className="h-4 w-4" />
          Workouts
        </TabsTrigger>
      </TabsList>

      {/* Client Info Tab */}
      <TabsContent value="info" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Physical Information</CardTitle>
            <CardDescription>Manage client's height and weight data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Height Section */}
            <div className="space-y-3">
              <Label htmlFor="height">Height (cm)</Label>
              <div className="flex gap-2">
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Enter height in cm"
                  disabled={setHeightMutation.isPending}
                  min="0"
                  step="0.1"
                />
                <Button
                  onClick={handleSaveHeight}
                  disabled={setHeightMutation.isPending}
                >
                  {setHeightMutation.isPending ? (
                    <>
                      <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              {heightError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{heightError}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Current Weight Display */}
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <Label className="text-sm font-medium text-muted-foreground">Current Weight</Label>
              {bodyWeightLoading ? (
                <Skeleton className="mt-2 h-8 w-32" />
              ) : latestWeight ? (
                <div className="mt-1">
                  <p className="text-2xl font-bold">{Number(latestWeight.weight)} kg</p>
                  <p className="text-sm text-muted-foreground">Last updated: {latestWeight.date}</p>
                </div>
              ) : (
                <p className="mt-1 text-muted-foreground italic">No weight data yet</p>
              )}
            </div>

            {/* Add Weight Entry */}
            <div className="space-y-3">
              <Label>Add Weight Entry</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="weight" className="text-sm">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Enter weight"
                    disabled={addWeightMutation.isPending}
                    min="0"
                    step="0.1"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="weightDate" className="text-sm">Date</Label>
                  <Input
                    id="weightDate"
                    type="date"
                    value={weightDate}
                    onChange={(e) => setWeightDate(e.target.value)}
                    disabled={addWeightMutation.isPending}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddWeight}
                disabled={addWeightMutation.isPending}
                className="w-full gap-2"
              >
                {addWeightMutation.isPending ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Weight Entry
                  </>
                )}
              </Button>
              {weightError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{weightError}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Progressions Tab */}
      <TabsContent value="progressions" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Bodyweight Progression</CardTitle>
            <CardDescription>Track weight changes over time</CardDescription>
          </CardHeader>
          <CardContent>
            {bodyWeightLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : bodyWeightError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Failed to load bodyweight history. Please try again.</AlertDescription>
              </Alert>
            ) : (
              <BodyweightProgressionChart data={bodyWeightHistory} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exercise Performance Progression</CardTitle>
            <CardDescription>Track performance improvements on exercises</CardDescription>
          </CardHeader>
          <CardContent>
            {exercisePerformanceLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : exercisePerformanceError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Failed to load exercise performance history. Please try again.</AlertDescription>
              </Alert>
            ) : (
              <ExercisePerformanceProgression data={exercisePerformanceHistory} />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Workouts Tab */}
      <TabsContent value="workouts" className="space-y-4">
        {showWorkoutBuilder ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{editingWorkout ? 'Edit Workout' : 'Create New Workout'}</CardTitle>
                  <CardDescription>
                    {editingWorkout ? `Editing "${editingWorkout.name}"` : `Design a workout plan for ${username}`}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={handleCloseBuilder}
                >
                  Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <WorkoutBuilder
                clientUsername={username}
                onSuccess={handleCloseBuilder}
                mode={editingWorkout ? 'edit' : 'trainer'}
                existingWorkout={editingWorkout || undefined}
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-end">
              <Button onClick={() => setShowWorkoutBuilder(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Workout
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Assigned Workouts</CardTitle>
                <CardDescription>Workouts for {username}</CardDescription>
              </CardHeader>
              <CardContent>
                {workoutsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : workoutsError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Failed to load workouts. Please try again.</AlertDescription>
                  </Alert>
                ) : (
                  <ClientWorkoutsList workouts={workouts} onEdit={handleEditWorkout} />
                )}
              </CardContent>
            </Card>
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
