import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dumbbell, User, AlertCircle, ArrowLeft } from 'lucide-react';

interface ClientLoginPageProps {
  onLoginSuccess: (username: string) => void;
  onNavigateToRegistration: () => void;
  onNavigateToTrainerLogin: () => void;
}

export default function ClientLoginPage({
  onLoginSuccess,
  onNavigateToRegistration,
  onNavigateToTrainerLogin
}: ClientLoginPageProps) {
  const [username, setUsername] = useState('');
  const [codicePT, setCodicePT] = useState('');
  const [error, setError] = useState('');
  const { actor } = useActor();

  const loginMutation = useMutation({
    mutationFn: async ({ user, code }: { user: string; code: string }) => {
      if (!actor) throw new Error('Backend not available. Please try again.');
      await actor.authenticateClient(user, code);
      return user;
    },
    onSuccess: (user) => {
      setError('');
      onLoginSuccess(user);
    },
    onError: (err: any) => {
      let errorMessage = 'An error occurred. Please try again.';
      
      if (err?.message) {
        const msg = err.message;
        if (msg.includes('Utente non trovato')) {
          errorMessage = 'User not found. Please check your username or register.';
        } else if (msg.includes('Codice PT non valido') || msg.includes('PT')) {
          errorMessage = 'Invalid PT code. Please check the code provided by your trainer.';
        } else if (msg.includes('Questo PT non esiste')) {
          errorMessage = 'This PT code does not exist. Please verify with your trainer.';
        } else {
          errorMessage = msg;
        }
      }
      
      setError(errorMessage);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim()) {
      setError('Please enter your username.');
      return;
    }

    if (!codicePT.trim()) {
      setError('Please enter the PT code.');
      return;
    }

    loginMutation.mutate({ user: username, code: codicePT });
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Personal Trainer</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToTrainerLogin}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna indietro
          </Button>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                <User className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Area Cliente</CardTitle>
              <CardDescription className="text-base">
                Accedi con le tue credenziali
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nome Utente</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Il tuo nome utente"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loginMutation.isPending}
                    className="h-11"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codicePT">Codice PT</Label>
                  <Input
                    id="codicePT"
                    type="text"
                    placeholder="Codice del tuo trainer"
                    value={codicePT}
                    onChange={(e) => setCodicePT(e.target.value)}
                    disabled={loginMutation.isPending}
                    className="h-11"
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="animate-in fade-in-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Accesso in corso...
                    </>
                  ) : (
                    'Accedi'
                  )}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Non hai un profilo? </span>
                  <button
                    type="button"
                    onClick={onNavigateToRegistration}
                    className="font-medium text-primary hover:underline"
                  >
                    Registrati
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
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
