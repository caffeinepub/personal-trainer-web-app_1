import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dumbbell, LogOut, Plus, TrendingUp, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useGetClientProgress, useAddWorkoutProgress } from '../hooks/useQueries';
import AssignedWorkoutsSection from '../components/client/AssignedWorkoutsSection';
import WorkoutLogsSection from '../components/client/WorkoutLogsSection';
import type { WorkoutProgress } from '../backend';

interface ClientDashboardPageProps {
  username: string;
  onLogout: () => void;
}

export default function ClientDashboardPage({ username, onLogout }: ClientDashboardPageProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        setWeights: Array(setsNum).fill(BigInt(weightNum))
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
          <AssignedWorkoutsSection username={username} />

          <Separator />

          {/* Workout Logs Section */}
          <WorkoutLogsSection username={username} />

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
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Storico Allenamenti</CardTitle>
                <CardDescription>
                  I tuoi allenamenti registrati
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : progressData && progressData.length > 0 ? (
                  <div className="space-y-4">
                    {[...progressData].reverse().map((progress, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-border/50 bg-card/50 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">
                            {progress.date}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {progress.exercises.map((exercise, exIndex) => {
                            const weight = exercise.setWeights?.[0] ? Number(exercise.setWeights[0]) : 0;
                            return (
                              <div key={exIndex} className="flex items-center gap-2">
                                <span className="font-semibold">{exercise.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {exercise.sets.toString()} serie × {exercise.repetitions.toString()} rip
                                </span>
                                <span className="text-sm font-medium text-primary">
                                  {weight} kg
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {progress.comments && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Note: {progress.comments}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border/50">
                    <p className="text-sm text-muted-foreground">
                      Nessun allenamento registrato. Inizia ad aggiungerne uno!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © 2026. Built with love using{' '}
          <a
            href="https://caffeine.ai"
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
