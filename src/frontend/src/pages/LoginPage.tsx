import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dumbbell, Lock, AlertCircle, Users } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onNavigateToClientLogin: () => void;
}

export default function LoginPage({ onLoginSuccess, onNavigateToClientLogin }: LoginPageProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { actor } = useActor();

  const loginMutation = useMutation({
    mutationFn: async (pwd: string) => {
      if (!actor) throw new Error('Backend non disponibile');
      await actor.authenticateTrainer(pwd);
    },
    onSuccess: () => {
      setError('');
      onLoginSuccess();
    },
    onError: (err: any) => {
      // Extract error message from backend trap
      let rawError = '';
      
      if (err?.message) {
        rawError = err.message;
      } else if (typeof err === 'string') {
        rawError = err;
      } else if (err?.toString && typeof err.toString === 'function') {
        const errStr = err.toString();
        // Extract message from "Error: Reject text" format
        if (errStr.includes('Reject text')) {
          const match = errStr.match(/Reject text:\s*(.+?)(?:\n|$)/);
          if (match && match[1]) {
            rawError = match[1].trim();
          }
        } else if (errStr.startsWith('Error: ')) {
          rawError = errStr.substring(7);
        } else {
          rawError = errStr;
        }
      }

      // Map backend errors to user-friendly English messages
      let userMessage = 'The access code you entered is incorrect. Please try again.';

      const lowerError = rawError.toLowerCase();
      
      // Authorization/permission errors
      if (lowerError.includes('unauthorized') || 
          lowerError.includes('only admins') || 
          lowerError.includes('assign user roles')) {
        userMessage = 'Access denied. Please check your access code and try again.';
      }
      // Wrong password (Italian backend message)
      else if (lowerError.includes('password') && 
               (lowerError.includes('non è corretta') || lowerError.includes('incorrect'))) {
        userMessage = 'The access code you entered is incorrect. Please try again.';
      }
      // Backend unavailable
      else if (lowerError.includes('backend non disponibile') || 
               lowerError.includes('backend') || 
               lowerError.includes('not available')) {
        userMessage = 'Service temporarily unavailable. Please try again in a moment.';
      }
      // Generic authentication failure
      else if (rawError && rawError.trim() !== '') {
        // If we have a specific error but it doesn't match known patterns,
        // still show a generic friendly message
        userMessage = 'Unable to authenticate. Please verify your access code.';
      }
      
      setError(userMessage);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!password.trim()) {
      setError('Please enter your access code to continue.');
      return;
    }

    loginMutation.mutate(password);
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
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Area Trainer</CardTitle>
              <CardDescription className="text-base">
                Inserisci il codice di accesso per continuare
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Codice di Accesso</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Inserisci il codice"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                    className="h-11"
                    autoFocus
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
                      Verifica in corso...
                    </>
                  ) : (
                    'Accedi come Trainer'
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">oppure</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 text-base font-semibold gap-2"
                  onClick={onNavigateToClientLogin}
                >
                  <Users className="h-4 w-4" />
                  Accedi come Cliente
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          © 2025. Built with love using{' '}
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
