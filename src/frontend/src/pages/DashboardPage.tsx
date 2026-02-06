import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dumbbell, LogOut, Activity, Calendar, Users, TrendingUp, Copy, CheckCircle2, AlertCircle, ArrowLeft, Mail, Settings, Lock } from 'lucide-react';
import { useGetTrainerPtCode, useGetClientsForTrainer, useGetClientProfile, useUpdateClientEmail } from '../hooks/useQueries';
import TrainerClientDetailSections from '../components/trainer/TrainerClientDetailSections';

interface DashboardPageProps {
  onLogout: () => void;
}

export default function DashboardPage({ onLogout }: DashboardPageProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // Personal settings state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const { data: ptCode, isLoading: ptCodeLoading, isError: ptCodeError } = useGetTrainerPtCode();
  const { data: clients = [], isLoading: clientsLoading, isError: clientsError } = useGetClientsForTrainer();
  const { data: clientProfile, isLoading: clientProfileLoading } = useGetClientProfile(selectedClient || '');
  const updateEmailMutation = useUpdateClientEmail();

  const formattedPtCode = ptCode ? String(ptCode).padStart(5, '0') : '';

  const handleCopyCode = async () => {
    if (formattedPtCode) {
      await navigator.clipboard.writeText(formattedPtCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleClientClick = (username: string) => {
    setSelectedClient(username);
    setEditingEmail(false);
    setUpdateError('');
    setUpdateSuccess(false);
  };

  const handleBackToList = () => {
    setSelectedClient(null);
    setEditingEmail(false);
    setUpdateError('');
    setUpdateSuccess(false);
  };

  const handleEditEmail = () => {
    setNewEmail(clientProfile?.emailOrNickname || '');
    setEditingEmail(true);
    setUpdateError('');
    setUpdateSuccess(false);
  };

  const handleSaveEmail = async () => {
    if (!selectedClient) return;

    setUpdateError('');
    setUpdateSuccess(false);

    try {
      await updateEmailMutation.mutateAsync({
        username: selectedClient,
        newEmail: newEmail.trim(),
      });
      setUpdateSuccess(true);
      setEditingEmail(false);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to update email. Please try again.';
      setUpdateError(errorMessage);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Tutti i campi sono obbligatori');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('Il nuovo codice deve essere di almeno 4 caratteri');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('I codici non corrispondono');
      return;
    }

    // TODO: Call backend method to update password when available
    // For now, show a message that the feature is coming soon
    setPasswordError('Funzionalità in arrivo: il backend non supporta ancora la modifica del codice di accesso');
    
    // When backend is ready, uncomment this:
    /*
    try {
      await updateTrainerPasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      const errorMessage = err?.message || 'Impossibile aggiornare il codice. Riprova.';
      setPasswordError(errorMessage);
    }
    */
  };

  const stats = [
    {
      title: 'Clienti Attivi',
      value: String(clients.length),
      icon: Users,
      description: clients.length === 1 ? '1 cliente' : `${clients.length} clienti`,
      gradient: 'from-chart-1 to-chart-2'
    },
    {
      title: 'Sessioni Oggi',
      value: '8',
      icon: Activity,
      description: '2 in programma',
      gradient: 'from-chart-3 to-chart-4'
    },
    {
      title: 'Questa Settimana',
      value: '42',
      icon: Calendar,
      description: 'Sessioni completate',
      gradient: 'from-chart-5 to-primary'
    },
    {
      title: 'Progressi',
      value: '95%',
      icon: TrendingUp,
      description: 'Obiettivi raggiunti',
      gradient: 'from-primary to-accent'
    }
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header with PT Code */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Dumbbell className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Personal Trainer</span>
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
          
          {/* PT Code Display */}
          <div className="mt-3 flex items-center justify-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            {ptCodeLoading ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-32" />
              </div>
            ) : ptCodeError ? (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Failed to load PT code</span>
              </div>
            ) : (
              <>
                <span className="text-sm font-medium text-muted-foreground">Your PT Code:</span>
                <span className="text-2xl font-bold tracking-wider text-primary">{formattedPtCode}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyCode}
                  className="gap-2"
                >
                  {copiedCode ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              Benvenuto nella Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Gestisci i tuoi clienti e monitora i progressi
            </p>
          </div>

          {/* Stats Grid */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-primary/5"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className={`rounded-lg bg-gradient-to-br ${stat.gradient} p-2`}>
                      <Icon className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tabbed Content: Clients and Personal Settings */}
          <Tabs defaultValue="clients" className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="clients" className="gap-2">
                <Users className="h-4 w-4" />
                I Miei Clienti
              </TabsTrigger>
              <TabsTrigger value="personal" className="gap-2">
                <Settings className="h-4 w-4" />
                Personale
              </TabsTrigger>
            </TabsList>

            {/* Clients Tab */}
            <TabsContent value="clients">
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    My Clients
                  </CardTitle>
                  <CardDescription>
                    {selectedClient ? 'Client details and management' : 'View and manage your clients'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {clientsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : clientsError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Failed to load clients. Please try again.</AlertDescription>
                    </Alert>
                  ) : selectedClient ? (
                    // Client Detail View
                    <div className="space-y-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToList}
                        className="gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to clients list
                      </Button>

                      {clientProfileLoading ? (
                        <div className="space-y-3">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : clientProfile ? (
                        <>
                          <div className="space-y-4 rounded-lg border border-border/50 bg-muted/30 p-6">
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                              <p className="mt-1 text-lg font-semibold">{clientProfile.username}</p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                                Email / Nickname
                              </Label>
                              {editingEmail ? (
                                <div className="space-y-3">
                                  <Input
                                    id="email"
                                    type="text"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="Enter email or nickname"
                                    className="h-11"
                                    disabled={updateEmailMutation.isPending}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={handleSaveEmail}
                                      disabled={updateEmailMutation.isPending}
                                      size="sm"
                                    >
                                      {updateEmailMutation.isPending ? (
                                        <>
                                          <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                                          Saving...
                                        </>
                                      ) : (
                                        'Save'
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => setEditingEmail(false)}
                                      disabled={updateEmailMutation.isPending}
                                      size="sm"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <p className="text-lg">
                                    {clientProfile.emailOrNickname || (
                                      <span className="text-muted-foreground italic">Not set</span>
                                    )}
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleEditEmail}
                                    className="gap-2"
                                  >
                                    <Mail className="h-4 w-4" />
                                    Edit
                                  </Button>
                                </div>
                              )}
                            </div>

                            {updateError && (
                              <Alert variant="destructive" className="animate-in fade-in-50">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{updateError}</AlertDescription>
                              </Alert>
                            )}

                            {updateSuccess && (
                              <Alert className="animate-in fade-in-50 border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertDescription>Email updated successfully!</AlertDescription>
                              </Alert>
                            )}
                          </div>

                          {/* New Client Detail Sections */}
                          <TrainerClientDetailSections username={selectedClient} />
                        </>
                      ) : null}
                    </div>
                  ) : clients.length === 0 ? (
                    // Empty State
                    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border/50">
                      <div className="text-center">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          No clients yet. Share your PT code to get started!
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Clients List
                    <div className="space-y-2">
                      {clients.map((client) => (
                        <button
                          key={client.username}
                          onClick={() => handleClientClick(client.username)}
                          className="w-full rounded-lg border border-border/50 bg-muted/30 p-4 text-left transition-all hover:border-primary/50 hover:bg-muted/50 hover:shadow-md"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{client.username}</p>
                              {client.emailOrNickname && (
                                <p className="text-sm text-muted-foreground">{client.emailOrNickname}</p>
                              )}
                            </div>
                            <div className="text-muted-foreground">→</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Personal Settings Tab */}
            <TabsContent value="personal">
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Impostazioni Personali
                  </CardTitle>
                  <CardDescription>
                    Gestisci il tuo codice di accesso trainer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div className="space-y-4 rounded-lg border border-border/50 bg-muted/30 p-6">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Codice di Accesso Attuale</Label>
                        <Input
                          id="current-password"
                          type="password"
                          placeholder="Inserisci il codice attuale"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="h-11"
                        />
                        <p className="text-xs text-muted-foreground">
                          Il codice attuale è: <span className="font-mono font-semibold">12345</span>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password">Nuovo Codice di Accesso</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="Inserisci il nuovo codice"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Conferma Nuovo Codice</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Conferma il nuovo codice"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>

                    {passwordError && (
                      <Alert variant="destructive" className="animate-in fade-in-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{passwordError}</AlertDescription>
                      </Alert>
                    )}

                    {passwordSuccess && (
                      <Alert className="animate-in fade-in-50 border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>Codice di accesso aggiornato con successo!</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full h-11 text-base font-semibold">
                      Aggiorna Codice di Accesso
                    </Button>

                    <Alert className="border-primary/20 bg-primary/5">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Nota:</strong> Dopo aver modificato il codice di accesso, dovrai utilizzare il nuovo codice per accedere alla prossima sessione.
                      </AlertDescription>
                    </Alert>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
