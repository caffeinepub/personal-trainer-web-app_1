import { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { useQueryClient } from '@tanstack/react-query';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientDashboardPage from './pages/ClientDashboardPage';
import RegistrationPage from './pages/RegistrationPage';
import ClientLoginPage from './pages/ClientLoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

type UserType = 'trainer' | 'client' | 'admin' | null;
type ViewType = 'trainer-login' | 'client-login' | 'registration' | 'dashboard' | 'admin-login' | 'admin-dashboard';

function App() {
  const queryClient = useQueryClient();
  const [userType, setUserType] = useState<UserType>(null);
  const [currentView, setCurrentView] = useState<ViewType>('trainer-login');
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Remove any dark class that might have been added
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }

    // Check if user is already authenticated from session storage
    const authType = sessionStorage.getItem('pt_auth_type');
    const storedUsername = sessionStorage.getItem('pt_username');
    
    if (authType === 'trainer') {
      setUserType('trainer');
      setCurrentView('dashboard');
      setIsLoading(false);
    } else if (authType === 'client' && storedUsername) {
      setUserType('client');
      setUsername(storedUsername);
      setCurrentView('dashboard');
      setIsLoading(false);
    } else if (authType === 'admin') {
      // For admin, just restore the session without backend verification
      // The AdminDashboardPage will handle verification and show access denied if needed
      setUserType('admin');
      setCurrentView('admin-dashboard');
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleTrainerLogin = () => {
    setUserType('trainer');
    setCurrentView('dashboard');
    sessionStorage.setItem('pt_auth_type', 'trainer');
  };

  const handleClientLogin = (clientUsername: string) => {
    setUserType('client');
    setUsername(clientUsername);
    setCurrentView('dashboard');
    sessionStorage.setItem('pt_auth_type', 'client');
    sessionStorage.setItem('pt_username', clientUsername);
  };

  const handleAdminLogin = () => {
    setUserType('admin');
    setCurrentView('admin-dashboard');
    sessionStorage.setItem('pt_auth_type', 'admin');
  };

  const handleLogout = () => {
    setUserType(null);
    setUsername('');
    setCurrentView('trainer-login');
    sessionStorage.removeItem('pt_auth_type');
    sessionStorage.removeItem('pt_username');
    queryClient.clear();
  };

  const handleAdminLogout = () => {
    setUserType(null);
    setCurrentView('trainer-login');
    sessionStorage.removeItem('pt_auth_type');
    queryClient.clear();
  };

  const handleNavigateToClientLogin = () => {
    setCurrentView('client-login');
  };

  const handleNavigateToRegistration = () => {
    setCurrentView('registration');
  };

  const handleNavigateToTrainerLogin = () => {
    setCurrentView('trainer-login');
  };

  const handleNavigateToAdminLogin = () => {
    setCurrentView('admin-login');
  };

  if (isLoading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-lg font-medium text-muted-foreground">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
      {currentView === 'trainer-login' && (
        <LoginPage
          onLoginSuccess={handleTrainerLogin}
          onNavigateToClientLogin={handleNavigateToClientLogin}
          onNavigateToAdmin={handleNavigateToAdminLogin}
        />
      )}
      {currentView === 'client-login' && (
        <ClientLoginPage
          onLoginSuccess={handleClientLogin}
          onNavigateToRegistration={handleNavigateToRegistration}
          onNavigateToTrainerLogin={handleNavigateToTrainerLogin}
        />
      )}
      {currentView === 'registration' && (
        <RegistrationPage
          onRegistrationSuccess={handleClientLogin}
          onNavigateToLogin={handleNavigateToTrainerLogin}
        />
      )}
      {currentView === 'dashboard' && userType === 'trainer' && (
        <DashboardPage onLogout={handleLogout} />
      )}
      {currentView === 'dashboard' && userType === 'client' && (
        <ClientDashboardPage username={username} onLogout={handleLogout} />
      )}
      {currentView === 'admin-login' && (
        <AdminLoginPage
          onLoginSuccess={handleAdminLogin}
          onBack={handleNavigateToTrainerLogin}
        />
      )}
      {currentView === 'admin-dashboard' && userType === 'admin' && (
        <AdminDashboardPage onLogout={handleAdminLogout} />
      )}
    </ThemeProvider>
  );
}

export default App;
