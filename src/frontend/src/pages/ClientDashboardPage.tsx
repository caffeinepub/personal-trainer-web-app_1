import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dumbbell, LogOut, Plus, TrendingUp, Calendar, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useGetClientProgress, useAddWorkoutProgress } from '../hooks/useQueries';
import AssignedWorkoutsSection from '../components/client/AssignedWorkoutsSection';
import WorkoutLogsSection from '../components/client/WorkoutLogsSection';
import AppointmentsSection from '../components/client/AppointmentsSection';
import WorkoutBuilder from '../components/trainer/WorkoutBuilder';
import WorkoutRunnerScreen from '../components/client/WorkoutRunnerScreen';
import type { WorkoutProgress, Workout } from '../backend';

interface ClientDashboardPageProps {
  username: string;
  onLogout: () => void;
}

export default function ClientDashboardPage({ username, onLogout }: ClientDashboardPageProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showWorkoutBuilder, setShowWorkoutBuilder] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Workout runner state
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  
  // Workout edit state
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  const { data: progressData, isLoading, refetch } = useGetClientProgress(username);
  const addProgressMutation = useAddWorkoutProgress();

  const handleAddProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!exerciseName.trim()) {
      setError('Inserisci il nome dell\'esercizio.');
      return;
    }

    const setsNum = parseInt(sets);
    const repsNum = parseInt(reps);
    const weightNum = parseInt(weight);

    if (isNaN(setsNum) || setsNum <= 0) {
      setError('Inserisci un numero valido di serie.');
      return;
    }

    if (isNaN(repsNum) || repsNum <= 0) {
      setError('Inserisci un numero valido di ripetizioni.');
      return;
    }

    if (isNaN(weightNum) || weightNum < 0) {
      setError('Inserisci un peso valido.');
      return;
    }

    const newProgress: WorkoutProgress = {
      date: new Date().toLocaleDateString('it-IT'),
      exercises: [{
        name: exerciseName,
        sets: BigInt(setsNum),
        repetitions: BigInt(repsNum),
        setWeights: Array(setsNum).fill(BigInt(weightNum)),
        restTime: BigInt(60)
      }],
      comments: comments
    };

    try {
      await addProgressMutation.mutateAsync({ username, progress: newProgress });
      setSuccess('Progresso aggiunto con successo!');
      setExerciseName('');
      setSets('');
      setReps('');
      setWeight('');
      setComments('');
      setShowAddForm(false);
      refetch();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.message || 'Errore durante l\'aggiunta del progresso.');
    }
  };

  const handleStartWorkout = (workout: Workout) => {
    setActiveWorkout(workout);
  };

  const handleExitRunner = () => {
    setActiveWorkout(null);
  };

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
  };

  const handleCloseEdit = () => {
    setEditingWorkout(null);
  };

  const handleEditSuccess = () => {
    setEditingWorkout(null);
    setSuccess('Workout updated successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  // If workout runner is active, show only the runner screen
  if (activeWorkout) {
    return (
      <WorkoutRunnerScreen
        workout={activeWorkout}
        onExit={handleExitRunner}
      />
    );
  }

  // If editing a workout, show the edit panel
  if (editingWorkout) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Dumbbell className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xl font-bold">Edit Workout</span>
                <p className="text-xs text-muted-foreground">{editingWorkout.name}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseEdit}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Edit Workout</CardTitle>
                <CardDescription>
                  Modify exercises, weights, rest times, and notes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkoutBuilder
                  clientUsername={username}
                  onSuccess={handleEditSuccess}
                  mode="edit"
                  existingWorkout={editingWorkout}
                />
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/40 bg-card/30 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()}. Built with love using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground transition-colors hover:text-primary"
            >
              caffeine.ai
            </a>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-bold">Personal Trainer</span>
              <p className="text-xs text-muted-foreground">Ciao, {username}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Esci
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Welcome Section */}
          <div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              La Tua Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Monitora i tuoi progressi e aggiungi nuovi allenamenti
            </p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <Alert className="border-green-500/50 bg-green-500/10 text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Allenamenti Totali
                </CardTitle>
                <div className="rounded-lg bg-gradient-to-br from-chart-1 to-chart-2 p-2">
                  <TrendingUp className="h-4 w-4 text-primary-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : progressData?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sessioni registrate
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ultimo Allenamento
                </CardTitle>
                <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-2">
                  <Calendar className="h-4 w-4 text-primary-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : progressData && progressData.length > 0 ? progressData[progressData.length - 1].date : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Data ultima sessione
                </p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Assigned Workouts Section */}
          <AssignedWorkoutsSection 
            username={username} 
            onStartWorkout={handleStartWorkout}
            onEditWorkout={handleEditWorkout}
          />

          <Separator />

          {/* Create Own Workout Section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Create Your Own Workout</h2>
                <p className="text-muted-foreground">Design a custom workout plan</p>
              </div>
              {!showWorkoutBuilder && (
                <Button onClick={() => setShowWorkoutBuilder(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Workout
                </Button>
              )}
            </div>

            {showWorkoutBuilder && (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>New Workout</CardTitle>
                      <CardDescription>Create a workout for yourself</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowWorkoutBuilder(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <WorkoutBuilder
                    clientUsername={username}
                    onSuccess={() => {
                      setShowWorkoutBuilder(false);
                      setSuccess('Workout created successfully!');
                      setTimeout(() => setSuccess(''), 3000);
                    }}
                    mode="client"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Workout Logs Section */}
          <WorkoutLogsSection username={username} />

          <Separator />

          {/* Appointments Section */}
          <AppointmentsSection username={username} />

          <Separator />

          {/* Legacy Progress Section */}
          <div>
            <h2 className="mb-4 text-2xl font-bold tracking-tight">Manual Progress Entry</h2>

            {/* Add Progress Button */}
            {!showAddForm && (
              <div className="mb-6">
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Aggiungi Allenamento
                </Button>
              </div>
            )}

            {/* Add Progress Form */}
            {showAddForm && (
              <Card className="mb-6 border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Nuovo Allenamento</CardTitle>
                  <CardDescription>
                    Registra il tuo allenamento di oggi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddProgress} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="exerciseName">Nome Esercizio *</Label>
                        <Input
                          id="exerciseName"
                          placeholder="es. Panca piana"
                          value={exerciseName}
                          onChange={(e) => setExerciseName(e.target.value)}
                          disabled={addProgressMutation.isPending}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sets">Serie *</Label>
                        <Input
                          id="sets"
                          type="number"
                          placeholder="es. 3"
                          value={sets}
                          onChange={(e) => setSets(e.target.value)}
                          disabled={addProgressMutation.isPending}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reps">Ripetizioni *</Label>
                        <Input
                          id="reps"
                          type="number"
                          placeholder="es. 10"
                          value={reps}
                          onChange={(e) => setReps(e.target.value)}
                          disabled={addProgressMutation.isPending}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="weight">Peso (kg) *</Label>
                        <Input
                          id="weight"
                          type="number"
                          placeholder="es. 60"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          disabled={addProgressMutation.isPending}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="comments">Note (opzionale)</Label>
                      <Textarea
                        id="comments"
                        placeholder="Aggiungi note sull'allenamento..."
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        disabled={addProgressMutation.isPending}
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={addProgressMutation.isPending}
                      >
                        {addProgressMutation.isPending ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                            Salvataggio...
                          </>
                        ) : (
                          'Salva Allenamento'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddForm(false);
                          setError('');
                        }}
                        disabled={addProgressMutation.isPending}
                      >
                        Annulla
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Progress History */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-border/50 bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="h-20 animate-pulse rounded bg-muted" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : progressData && progressData.length > 0 ? (
              <div className="space-y-4">
                {progressData.slice().reverse().map((progress, index) => (
                  <Card key={index} className="border-border/50 bg-card/80 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{progress.date}</CardTitle>
                        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          {progress.exercises.length} {progress.exercises.length === 1 ? 'esercizio' : 'esercizi'}
                        </div>
                      </div>
                      {progress.comments && (
                        <CardDescription>{progress.comments}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {progress.exercises.map((exercise, exIndex) => (
                          <div
                            key={exIndex}
                            className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 p-3"
                          >
                            <div>
                              <p className="font-semibold">{exercise.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {Number(exercise.sets)} serie × {Number(exercise.repetitions)} rip
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">
                                {exercise.setWeights.length > 0 ? Number(exercise.setWeights[0]) : 0} kg
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="py-12 text-center">
                  <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">Nessun allenamento registrato</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Inizia ad aggiungere i tuoi allenamenti per monitorare i progressi
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground transition-colors hover:text-primary"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
