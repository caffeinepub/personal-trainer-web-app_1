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
    // Check if user is already authenticated from session storage
    const authType = sessionStorage.getItem('pt_auth_type');
    const storedUsername = sessionStorage.getItem('pt_username');
    
    if (authType === 'trainer') {
      setUserType('trainer');
      setCurrentView('dashboard');
    } else if (authType === 'client' && storedUsername) {
      setUserType('client');
      setUsername(storedUsername);
      setCurrentView('dashboard');
    } else if (authType === 'admin') {
      setUserType('admin');
      setCurrentView('admin-dashboard');
    }
    setIsLoading(false);
  }, []);

  const handleTrainerLoginSuccess = () => {
    sessionStorage.setItem('pt_auth_type', 'trainer');
    setUserType('trainer');
    setCurrentView('dashboard');
  };

  const handleClientLoginSuccess = (clientUsername: string) => {
    sessionStorage.setItem('pt_auth_type', 'client');
    sessionStorage.setItem('pt_username', clientUsername);
    setUserType('client');
    setUsername(clientUsername);
    setCurrentView('dashboard');
  };

  const handleAdminLoginSuccess = () => {
    sessionStorage.setItem('pt_auth_type', 'admin');
    setUserType('admin');
    setCurrentView('admin-dashboard');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pt_auth_type');
    sessionStorage.removeItem('pt_username');
    setUserType(null);
    setUsername('');
    setCurrentView('trainer-login');
    // Clear all cached queries
    queryClient.clear();
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('pt_auth_type');
    setUserType(null);
    setCurrentView('trainer-login');
    // Clear all cached queries
    queryClient.clear();
  };

  const handleNavigateToClientLogin = () => {
    setCurrentView('client-login');
  };

  const handleNavigateToTrainerLogin = () => {
    setCurrentView('trainer-login');
  };

  const handleNavigateToRegistration = () => {
    setCurrentView('registration');
  };

  const handleNavigateToAdminLogin = () => {
    setCurrentView('admin-login');
  };

  const handleRegistrationSuccess = (clientUsername: string) => {
    sessionStorage.setItem('pt_auth_type', 'client');
    sessionStorage.setItem('pt_username', clientUsername);
    setUserType('client');
    setUsername(clientUsername);
    setCurrentView('dashboard');
  };

  if (isLoading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="min-h-screen bg-background">
        {currentView === 'dashboard' && userType === 'trainer' && (
          <DashboardPage onLogout={handleLogout} />
        )}
        {currentView === 'dashboard' && userType === 'client' && (
          <ClientDashboardPage username={username} onLogout={handleLogout} />
        )}
        {currentView === 'admin-dashboard' && (
          <AdminDashboardPage onLogout={handleAdminLogout} />
        )}
        {currentView === 'admin-login' && (
          <AdminLoginPage
            onLoginSuccess={handleAdminLoginSuccess}
            onBack={handleNavigateToTrainerLogin}
          />
        )}
        {currentView === 'trainer-login' && (
          <LoginPage
            onLoginSuccess={handleTrainerLoginSuccess}
            onNavigateToClientLogin={handleNavigateToClientLogin}
            onNavigateToAdmin={handleNavigateToAdminLogin}
          />
        )}
        {currentView === 'client-login' && (
          <ClientLoginPage
            onLoginSuccess={handleClientLoginSuccess}
            onNavigateToRegistration={handleNavigateToRegistration}
            onNavigateToTrainerLogin={handleNavigateToTrainerLogin}
          />
        )}
        {currentView === 'registration' && (
          <RegistrationPage
            onRegistrationSuccess={handleRegistrationSuccess}
            onNavigateToLogin={handleNavigateToClientLogin}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
