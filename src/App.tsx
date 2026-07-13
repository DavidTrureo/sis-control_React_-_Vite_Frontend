import { useState, useEffect } from 'react';
import { TokenService } from './services/api';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import Home from './pages/Home';
import RealTimeMonitor from './pages/RealTimeMonitor';
import AlertsAndIncidents from './pages/AlertsAndIncidents';
import UserManagement from './pages/UserManagement';
import InstallationsManagement from './pages/InstallationsManagement';
import SupervisorConsole from './pages/SupervisorConsole';
import AuditLog from './pages/AuditLog';

type Tab = 'home' | 'monitor' | 'incidents' | 'users' | 'installations' | 'operations' | 'audit';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = TokenService.getToken();
      const user = TokenService.getUser();
      
      if (token && user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Cargando SIS-CONTROL...</p>
      </div>
    );
  }

  // Si no está autenticado, renderizar la pantalla de Login
  if (!isAuthenticated) {
    return <Login />;
  }

  const user = TokenService.getUser();
  const userRole = user?.role || 'SUPERVISOR';

  // Cambiar el título del encabezado según la sección activa
  const getTabTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'Panel de Estadísticas y Control';
      case 'monitor':
        return 'Monitoreo de Rondas y Checkpoints en Vivo';
      case 'incidents':
        return 'Gestión de Incidentes y Alertas de Pánico SOS';
      case 'users':
        return 'Administración de Usuarios del Sistema';
      case 'installations':
        return 'Administración de Instalaciones Fijas y Checkpoints NFC';
      case 'operations':
        return 'Consola de Control de Operaciones del Supervisor';
      case 'audit':
        return 'Bitácora de Auditoría del Sistema (Logs)';
      default:
        return 'SIS-CONTROL';
    }
  };

  // Renderizar la página activa de forma dinámica
  const renderActivePage = () => {
    switch (activeTab) {
      case 'home':
        return <Home onNavigate={(tab) => setActiveTab(tab as Tab)} />;
      case 'monitor':
        return <RealTimeMonitor />;
      case 'incidents':
        return <AlertsAndIncidents />;
      case 'users':
        return userRole === 'ADMIN' ? <UserManagement /> : <Home />;
      case 'installations':
        return userRole === 'ADMIN' ? <InstallationsManagement /> : <Home />;
      case 'operations':
        return (userRole === 'ADMIN' || userRole === 'SUPERVISOR') ? <SupervisorConsole /> : <Home onNavigate={(tab) => setActiveTab(tab as Tab)} />;
      case 'audit':
        return userRole === 'ADMIN' ? <AuditLog /> : <Home onNavigate={(tab) => setActiveTab(tab as Tab)} />;
      default:
        return <Home onNavigate={(tab) => setActiveTab(tab as Tab)} />;
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={(tab) => {
        // Validación de permisos para la pestaña de usuarios, instalaciones, operaciones y auditoría
        if ((tab === 'users' || tab === 'installations' || tab === 'audit') && userRole !== 'ADMIN') {
          setActiveTab('home');
        } else if (tab === 'operations' && userRole !== 'ADMIN' && userRole !== 'SUPERVISOR') {
          setActiveTab('home');
        } else {
          setActiveTab(tab);
        }
      }}
      title={getTabTitle()}
    >
      {renderActivePage()}
    </DashboardLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#030712',
    gap: '20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid rgba(29, 78, 216, 0.1)',
    borderTopColor: '#3b82f6',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: '15px',
    fontWeight: '600',
    letterSpacing: '0.5px',
  },
};
