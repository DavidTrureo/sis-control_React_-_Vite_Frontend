import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturó un error no controlado:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.iconWrapper}>
              <AlertTriangle size={36} color="#ef4444" />
            </div>
            <h2 style={styles.title}>Ocurrió un error inesperado</h2>
            <p style={styles.description}>
              La interfaz encontró una excepción inesperada al renderizar la vista.
              Por seguridad, la sesión sigue activa.
            </p>
            {this.state.error && (
              <pre style={styles.errorDetails}>
                {this.state.error.message}
              </pre>
            )}
            <button onClick={this.handleReload} style={styles.reloadBtn}>
              <RefreshCw size={16} />
              <span>Recargar Aplicación</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#030712',
    padding: '20px',
  },
  card: {
    backgroundColor: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '36px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
  },
  iconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  },
  title: {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 10px',
  },
  description: {
    color: '#94a3b8',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0 0 20px',
  },
  errorDetails: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    padding: '12px',
    color: '#fca5a5',
    fontSize: '12px',
    fontFamily: 'monospace',
    textAlign: 'left',
    overflowX: 'auto',
    marginBottom: '24px',
  },
  reloadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};
