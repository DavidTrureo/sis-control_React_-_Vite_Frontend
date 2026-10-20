import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { api, TokenService } from '../services/api';
import logoImg from '../assets/logo.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Iniciar sesión y autenticar credenciales
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUser || !trimmedPassword) {
      setError('Por favor, completa tanto tu usuario como tu contraseña.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', {
        username: trimmedUser,
        password: trimmedPassword,
      });

      const data = response.data;
      if (data && data.success && data.token) {
        const userRole = data.role;
        
        // El Dashboard es exclusivo para ADMIN y SUPERVISOR
        if (userRole === 'ADMIN' || userRole === 'SUPERVISOR') {
          TokenService.saveToken(data.token);
          TokenService.saveUser({
            userId: data.userId,
            username: data.username,
            role: userRole,
            fullName: data.fullName,
            email: data.email,
          });

          // Redirigir según el rol
          if (userRole === 'ADMIN') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/supervisor';
          }
        } else {
          setError('Acceso denegado. Este portal es exclusivo para personal de administración y supervisión.');
        }
      } else {
        setError(data.message || 'Usuario o contraseña incorrectos. Por favor, verifica tus datos e intenta nuevamente.');
      }
    } catch (err: any) {
      console.error('Error logging in:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Usuario o contraseña incorrectos. Verifica que no tengas la tecla Bloq Mayús activada o que tu usuario esté bien escrito.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Círculos decorativos de fondo con gradientes de neón (Glassmorphism) */}
      <div style={styles.neonBg1}></div>
      <div style={styles.neonBg2}></div>

      <div className="glass-panel" style={styles.loginBox}>
        {/* Encabezado Logo */}
        <div style={styles.header}>
          <div style={styles.logoBadge}>
            <img src={logoImg} alt="SIS-Control" style={styles.logoImage} />
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>
              Iniciar Sesión
            </h2>
            <p style={{ fontSize: '13.5px', color: '#94a3b8' }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <p style={{ fontSize: '13.5px', fontWeight: '500' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Usuario o Correo Electrónico</label>
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input
                type="text"
                placeholder="ej. admin@siscontrol.cl"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-premium"
                style={{ paddingLeft: '44px' }}
                disabled={loading}
                autoComplete="username"
                autoCapitalize="none"
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-premium"
                style={{ paddingLeft: '44px', paddingRight: '44px' }}
                disabled={loading}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={styles.submitBtn} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spin-animation" style={styles.spinner} />
                Iniciando Sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#030712',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
  },
  neonBg1: {
    position: 'absolute',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(29, 78, 216, 0.25) 0%, rgba(29, 78, 216, 0) 70%)',
    top: '15%',
    left: '20%',
    zIndex: 1,
  },
  neonBg2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0) 70%)',
    bottom: '15%',
    right: '15%',
    zIndex: 1,
  },
  loginBox: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px 30px',
    zIndex: 10,
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
  },
  logoBadge: {
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    padding: '12px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.35), 0 0 20px rgba(29, 78, 216, 0.2)',
    marginBottom: '6px',
  },
  logoImage: {
    width: '135px',
    height: 'auto',
    maxHeight: '135px',
    objectFit: 'contain',
    display: 'block',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '20px',
    color: '#f87171',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#cbd5e1',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: '#64748b',
  },
  eyeBtn: {
    position: 'absolute',
    right: '16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  },
  submitBtn: {
    width: '100%',
    marginTop: '8px',
    fontSize: '15px',
    height: '46px',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '20px',
    padding: '6px 12px',
    alignSelf: 'center',
    marginBottom: '8px',
  },
  userBadgeText: {
    fontSize: '13px',
    color: '#cbd5e1',
    fontWeight: '500',
  },
  changeUserBtn: {
    fontSize: '12px',
    color: '#3b82f6',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    fontWeight: '600',
    textDecoration: 'underline',
  },
  spinner: {
    marginRight: '8px',
    animation: 'spin 1s linear infinite',
  },
};

// Insertar animación de spin de forma dinámica
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spin-animation {
      animation: spin 1s linear infinite;
    }
  `;
  document.head.appendChild(styleSheet);
}
