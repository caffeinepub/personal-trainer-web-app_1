import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Shield, LogOut, Users, AlertCircle } from 'lucide-react';
import { useGetAdminOverview, useGetAllTrainers } from '../hooks/useQueries';
import { normalizeError } from '../utils/userFacingErrors';
import PersonnelTable from '../components/admin/PersonnelTable';

interface AdminDashboardPageProps {
  onLogout: () => void;
}

export default function AdminDashboardPage({ onLogout }: AdminDashboardPageProps) {
  const { data: overview, isLoading: overviewLoading, isError: overviewError, error: overviewErrorData } = useGetAdminOverview();
  const { data: trainers, isLoading: trainersLoading, isError: trainersError, error: trainersErrorData } = useGetAllTrainers();

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

          {/* Personnel Section */}
          {isLoading ? (
            <div className="mb-8">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : isError ? (
            <div className="mb-8">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {normalizeError(error)}
                </AlertDescription>
              </Alert>
            </div>
          ) : trainers ? (
            <div className="mb-8">
              <PersonnelTable trainers={trainers} />
            </div>
          ) : null}

          {/* Trainers List */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Trainers & Clients
              </CardTitle>
              <CardDescription>
                Complete overview of all trainers and their associated clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : isError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {normalizeError(error)}
                  </AlertDescription>
                </Alert>
              ) : !overview || overview.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-lg font-medium text-muted-foreground">
                    No trainers found
                  </p>
                  <p className="text-sm text-muted-foreground">
                    No trainers have registered yet
                  </p>
                </div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {overview.map((trainer, index) => (
                    <AccordionItem key={trainer.trainerPrincipal.toString()} value={`trainer-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex w-full items-center justify-between pr-4 text-left">
                          <div className="flex-1">
                            <div className="font-semibold">
                              Trainer #{index + 1}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              PT Code: {String(trainer.ptCode).padStart(5, '0')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>
                              {trainer.clients.length} {trainer.clients.length === 1 ? 'client' : 'clients'}
                            </span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                            <div className="mb-2 text-xs font-medium text-muted-foreground">
                              Trainer Principal ID
                            </div>
                            <div className="break-all font-mono text-xs">
                              {trainer.trainerPrincipal.toString()}
                            </div>
                          </div>

                          {trainer.clients.length === 0 ? (
                            <div className="rounded-lg border border-border/50 bg-muted/10 p-6 text-center">
                              <p className="text-sm text-muted-foreground">
                                No clients assigned to this trainer
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-sm font-medium">Clients:</div>
                              <div className="space-y-2">
                                {trainer.clients.map((client) => (
                                  <div
                                    key={client.username}
                                    className="rounded-lg border border-border/50 bg-background p-3"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="font-medium">{client.username}</div>
                                        {client.emailOrNickname && (
                                          <div className="text-sm text-muted-foreground">
                                            {client.emailOrNickname}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {client.progressData.length} workouts logged
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
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
