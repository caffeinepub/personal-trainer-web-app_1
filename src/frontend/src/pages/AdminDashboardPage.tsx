import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Shield, LogOut, Users, AlertCircle, XCircle } from 'lucide-react';
import { useGetAdminOverview, useGetAllTrainers, useIsCallerAdmin } from '../hooks/useQueries';
import { normalizeError } from '../utils/userFacingErrors';
import PersonnelTable from '../components/admin/PersonnelTable';

interface AdminDashboardPageProps {
  onLogout: () => void;
}

export default function AdminDashboardPage({ onLogout }: AdminDashboardPageProps) {
  const { data: isAdmin, isLoading: isAdminLoading, isFetched: isAdminFetched, isError: isAdminError } = useIsCallerAdmin();
  const { data: overview, isLoading: overviewLoading, isError: overviewError, error: overviewErrorData } = useGetAdminOverview();
  const { data: trainers, isLoading: trainersLoading, isError: trainersError, error: trainersErrorData } = useGetAllTrainers();

  // Check admin status and redirect if unauthorized (only after verification is complete)
  useEffect(() => {
    if (isAdminFetched && !isAdmin) {
      // Not authorized, trigger logout
      onLogout();
    }
  }, [isAdmin, isAdminFetched, onLogout]);

  // Show loading while verifying admin status
  if (isAdminLoading || !isAdminFetched) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-lg font-medium text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (isAdminError || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
        <Card className="w-full max-w-md border-destructive/50 bg-card/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Admin authentication required. Please log in with valid admin credentials.
              </AlertDescription>
            </Alert>
            <Button
              onClick={onLogout}
              className="w-full"
              variant="outline"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = overviewLoading || trainersLoading;
  const isError = overviewError || trainersError;
  const error = overviewErrorData || trainersErrorData;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Admin Dashboard</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Exit Admin
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              Platform Overview
            </h1>
            <p className="text-lg text-muted-foreground">
              View all trainers and their clients
            </p>
          </div>

          {/* Stats */}
          {!isLoading && overview && (
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Trainers</CardTitle>
                  <div className="rounded-lg bg-gradient-to-br from-chart-1 to-chart-2 p-2">
                    <Users className="h-4 w-4 text-primary-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active trainers on platform
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                  <div className="rounded-lg bg-gradient-to-br from-chart-3 to-chart-4 p-2">
                    <Users className="h-4 w-4 text-primary-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overview.reduce((sum, trainer) => sum + trainer.clients.length, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total registered clients
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Clients/Trainer</CardTitle>
                  <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-2">
                    <Users className="h-4 w-4 text-primary-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overview.length > 0
                      ? (overview.reduce((sum, trainer) => sum + trainer.clients.length, 0) / overview.length).toFixed(1)
                      : '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average per trainer
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-border/50 bg-card/80 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="mb-2 h-8 w-16" />
                      <Skeleton className="h-3 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          )}

          {/* Error State */}
          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {normalizeError(error)}
              </AlertDescription>
            </Alert>
          )}

          {/* Trainers Overview */}
          {!isLoading && !isError && overview && (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Trainers & Clients</CardTitle>
                <CardDescription>
                  Detailed view of all trainers and their associated clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overview.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                    <p className="text-lg font-medium text-muted-foreground">
                      No trainers registered yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Trainers will appear here once they register
                    </p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {overview.map((trainer, index) => (
                      <AccordionItem key={trainer.trainerPrincipal.toString()} value={`trainer-${index}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                              <Shield className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div className="text-left">
                              <div className="font-semibold">
                                PT Code: {trainer.ptCode.toString()}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {trainer.clients.length} {trainer.clients.length === 1 ? 'client' : 'clients'}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                            {trainer.clients.length === 0 ? (
                              <p className="text-center text-sm text-muted-foreground">
                                No clients registered for this trainer
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {trainer.clients.map((client) => (
                                  <div
                                    key={client.username}
                                    className="flex items-center justify-between rounded-md border border-border/30 bg-card/50 p-3"
                                  >
                                    <div>
                                      <div className="font-medium">{client.username}</div>
                                      {client.emailOrNickname && (
                                        <div className="text-sm text-muted-foreground">
                                          {client.emailOrNickname}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {client.progressData.length} workout{client.progressData.length !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          )}

          {/* Personnel Table */}
          {!isLoading && !isError && trainers && trainers.length > 0 && (
            <div className="mt-8">
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Personnel Directory</CardTitle>
                  <CardDescription>
                    Complete list of registered trainers with their details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PersonnelTable trainers={trainers} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/50 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
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
