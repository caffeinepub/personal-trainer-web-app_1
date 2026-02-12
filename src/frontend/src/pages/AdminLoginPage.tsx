import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuthenticateAdmin } from '../hooks/useQueries';
import { normalizeError } from '../utils/userFacingErrors';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onBack: () => void;
}

const CORRECT_ADMIN_CODE = '9876';

export default function AdminLoginPage({ onLoginSuccess, onBack }: AdminLoginPageProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const authenticateAdminMutation = useAuthenticateAdmin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Please enter the admin access code');
      return;
    }

    // Client-side validation for admin code
    if (password.trim() !== CORRECT_ADMIN_CODE) {
      setError('Incorrect admin access code. Please verify your credentials.');
      return;
    }

    try {
      await authenticateAdminMutation.mutateAsync(password.trim());
      onLoginSuccess();
    } catch (err: any) {
      const errorMessage = normalizeError(err);
      setError(errorMessage);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
      <div className="w-full max-w-md">
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
            <CardDescription>
              Enter admin credentials to access the management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Admin Access Code</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin access code"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={authenticateAdminMutation.isPending}
                  className="h-11"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={authenticateAdminMutation.isPending}
              >
                {authenticateAdminMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Authenticating...
                  </>
                ) : (
                  'Access Admin Dashboard'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2"
                onClick={onBack}
                disabled={authenticateAdminMutation.isPending}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>

        <footer className="mt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground transition-colors hover:text-primary"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
