import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dumbbell, LogOut, Activity, Calendar, Users, TrendingUp, Copy, CheckCircle2, AlertCircle, ArrowLeft, Mail, Settings, Lock, Loader2 } from 'lucide-react';
import { useGetTrainerPtCode, useGetClientsForTrainer, useGetClientProfile, useUpdateClientEmail, useUpdateTrainerCode, useRegisterTrainerIdentity } from '../hooks/useQueries';
import TrainerClientDetailSections from '../components/trainer/TrainerClientDetailSections';
import TrainerBookingsCalendar from '../components/trainer/TrainerBookingsCalendar';
import { extractErrorMessage, mapTrainerCodeChangeError } from '../utils/trainerAuthErrors';
import { normalizeError } from '../utils/userFacingErrors';

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

  // Trainer identity state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [identityError, setIdentityError] = useState('');
  const [identitySuccess, setIdentitySuccess] = useState(false);

  const { data: ptCode, isLoading: ptCodeLoading, isError: ptCodeError } = useGetTrainerPtCode();
  const { data: clients = [], isLoading: clientsLoading, isError: clientsError } = useGetClientsForTrainer();
  const { data: clientProfile, isLoading: clientProfileLoading } = useGetClientProfile(selectedClient || '');
  const updateEmailMutation = useUpdateClientEmail();
  const updateTrainerCodeMutation = useUpdateTrainerCode();
  const registerIdentityMutation = useRegisterTrainerIdentity();

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
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      setUpdateError(errorMessage);
    }
  };

  const handleCancelEdit = () => {
    setEditingEmail(false);
    setUpdateError('');
    setNewEmail('');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentPassword.trim()) {
      setPasswordError('Please enter your current access code.');
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError('Please enter a new access code.');
      return;
    }

    if (newPassword.length < 5 || newPassword.length > 20) {
      setPasswordError('The new code should be at least 5 characters long and should not exceed 20 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('The new codes do not match.');
      return;
    }

    try {
      await updateTrainerCodeMutation.mutateAsync({
        currentCode: currentPassword,
        newCode: newPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (error) {
      const rawErrorMessage = extractErrorMessage(error);
      const errorMessage = mapTrainerCodeChangeError(rawErrorMessage);
      setPasswordError(errorMessage);
    }
  };

  const handleIdentitySave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdentityError('');
    setIdentitySuccess(false);

    if (!firstName.trim()) {
      setIdentityError('Please enter your first name.');
      return;
    }

    if (!lastName.trim()) {
      setIdentityError('Please enter your last name.');
      return;
    }

    try {
      await registerIdentityMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setIdentitySuccess(true);
      setTimeout(() => setIdentitySuccess(false), 5000);
    } catch (error) {
      const rawMessage = normalizeError(error);
      
      if (rawMessage.includes('already exists')) {
        setIdentityError('Your name has already been registered. You cannot change it at this time.');
      } else if (rawMessage.includes('authenticate first')) {
        setIdentityError('Please log in again to register your name.');
      } else {
        setIdentityError(rawMessage);
      }
    }
  };

  if (selectedClient) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Torna ai clienti
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                  <Dumbbell className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">{selectedClient}</h1>
                  <p className="text-xs text-muted-foreground">Dettagli Cliente</p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Esci
            </Button>
          </div>
        </header>

        <main className="flex-1 bg-gradient-to-br from-background via-background to-muted/20">
          <div className="container mx-auto p-4 md:p-6">
            {clientProfileLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <>
                <Card className="mb-6 border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Informazioni Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-sm text-muted-foreground">Nome Utente</Label>
                        <p className="text-lg font-medium">{selectedClient}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Email/Nickname</Label>
                        {editingEmail ? (
                          <div className="flex gap-2">
                            <Input
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="Inserisci email o nickname"
                              className="h-9"
                            />
                            <Button
                              size="sm"
                              onClick={handleSaveEmail}
                              disabled={updateEmailMutation.isPending}
                            >
                              {updateEmailMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Salva'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              disabled={updateEmailMutation.isPending}
                            >
                              Annulla
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-medium">
                              {clientProfile?.emailOrNickname || 'Non specificato'}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleEditEmail}
                              className="h-8 gap-1"
                            >
                              <Mail className="h-3 w-3" />
                              Modifica
                            </Button>
                          </div>
                        )}
                      </div>
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
                        <AlertDescription>Email aggiornata con successo!</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <TrainerClientDetailSections username={selectedClient} />
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Dashboard Trainer</h1>
              <p className="text-xs text-muted-foreground">Gestisci i tuoi clienti</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Esci
          </Button>
        </div>
      </header>

      <main className="flex-1 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto p-4 md:p-6">
          <Tabs defaultValue="clients" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value="clients" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Clienti</span>
              </TabsTrigger>
              <TabsTrigger value="bookings" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Prenotazioni</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Impostazioni</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clients" className="space-y-6">
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Il Tuo Codice PT
                  </CardTitle>
                  <CardDescription>
                    Condividi questo codice con i tuoi clienti per permettere loro di registrarsi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ptCodeLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : ptCodeError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Errore nel caricamento del codice PT. Riprova più tardi.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                          <p className="text-center text-4xl font-bold tracking-wider text-primary">
                            {formattedPtCode}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleCopyCode}
                        variant="outline"
                        size="lg"
                        className="gap-2"
                      >
                        {copiedCode ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            Copiato!
                          </>
                        ) : (
                          <>
                            <Copy className="h-5 w-5" />
                            Copia
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    I Tuoi Clienti
                  </CardTitle>
                  <CardDescription>
                    Seleziona un cliente per visualizzare i dettagli e gestire i progressi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {clientsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : clientsError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Errore nel caricamento dei clienti. Riprova più tardi.
                      </AlertDescription>
                    </Alert>
                  ) : clients.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-border/50 p-12 text-center">
                      <TrendingUp className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-lg font-medium text-muted-foreground">
                        Nessun cliente registrato
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Condividi il tuo codice PT per iniziare
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clients.map((client) => (
                        <button
                          key={client.username}
                          onClick={() => handleClientClick(client.username)}
                          className="w-full rounded-lg border border-border/50 bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-accent/50 hover:shadow-md"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{client.username}</p>
                              <p className="text-sm text-muted-foreground">
                                {client.emailOrNickname || 'Nessuna email specificata'}
                              </p>
                            </div>
                            <ArrowLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings">
              <TrainerBookingsCalendar />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Nome e Cognome
                  </CardTitle>
                  <CardDescription>
                    Inserisci il tuo nome e cognome che verrà associato al tuo codice PT
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleIdentitySave} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nome *</Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="Il tuo nome"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={registerIdentityMutation.isPending}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Cognome *</Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Il tuo cognome"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          disabled={registerIdentityMutation.isPending}
                          className="h-11"
                        />
                      </div>
                    </div>

                    {identityError && (
                      <Alert variant="destructive" className="animate-in fade-in-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{identityError}</AlertDescription>
                      </Alert>
                    )}

                    {identitySuccess && (
                      <Alert className="animate-in fade-in-50 border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>Nome salvato con successo!</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      disabled={registerIdentityMutation.isPending}
                      className="gap-2"
                    >
                      {registerIdentityMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Salvataggio...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Salva Nome
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    Cambia Codice di Accesso
                  </CardTitle>
                  <CardDescription>
                    Modifica il codice che usi per accedere alla dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Codice Attuale *</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="Inserisci il codice attuale"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={updateTrainerCodeMutation.isPending}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nuovo Codice *</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Inserisci il nuovo codice (5-20 caratteri)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={updateTrainerCodeMutation.isPending}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Conferma Nuovo Codice *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Conferma il nuovo codice"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={updateTrainerCodeMutation.isPending}
                        className="h-11"
                      />
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
                        <AlertDescription>
                          Codice di accesso aggiornato con successo!
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      disabled={updateTrainerCodeMutation.isPending}
                      className="gap-2"
                    >
                      {updateTrainerCodeMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Aggiornamento...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Aggiorna Codice
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

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
