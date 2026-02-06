import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dumbbell, Lock, AlertCircle, Users, Loader2 } from 'lucide-react';
import { extractErrorMessage, mapTrainerAuthError } from '../utils/trainerAuthErrors';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onNavigateToClientLogin: () => void;
}

export default function LoginPage({ onLoginSuccess, onNavigateToClientLogin }: LoginPageProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { actor, isFetching } = useActor();

  const loginMutation = useMutation({
    mutationFn: async (pwd: string) => {
      if (!actor) {
        throw new Error('SERVICE_UNAVAILABLE');
      }
      // Normalize the password by trimming whitespace
      const normalizedPwd = pwd.trim();
      await actor.authenticateTrainer(normalizedPwd);
    },
    onSuccess: () => {
      setError('');
      onLoginSuccess();
    },
    onError: (err: unknown) => {
      // Extract the raw error message
      const rawError = extractErrorMessage(err);
      
      // Map to user-friendly message
      const userMessage = mapTrainerAuthError(rawError);
      
      setError(userMessage);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous errors
    setError('');
    
    // Check if actor is available
    if (!actor) {
      setError('Service is not available. Please wait a moment and try again.');
      return;
    }
    
    // Validate input
    if (!password.trim()) {
      setError('Please enter your access code to continue.');
      return;
    }

    loginMutation.mutate(password);
  };

  // Determine if the form should be disabled
  const isFormDisabled = isFetching || !actor || loginMutation.isPending;
  const isInitializing = isFetching || !actor;

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
              <CardTitle className="text-2xl font-bold">Trainer Area</CardTitle>
              <CardDescription className="text-base">
                Enter your access code to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Access Code</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your code"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isFormDisabled}
                    className="h-11"
                    autoFocus
                  />
                </div>

                {isInitializing && !error && (
                  <Alert className="animate-in fade-in-50">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>Connecting to service...</AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive" className="animate-in fade-in-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  disabled={isFormDisabled}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : isInitializing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    'Login as Trainer'
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 text-base font-semibold gap-2"
                  onClick={onNavigateToClientLogin}
                  disabled={isFormDisabled}
                >
                  <Users className="h-4 w-4" />
                  Login as Client
                </Button>
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
