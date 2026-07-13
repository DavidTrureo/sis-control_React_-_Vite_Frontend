import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, MapPin, AlertOctagon, Users, LogOut, Bell, Building2, Activity, X, ClipboardList, Megaphone, User, Camera, Upload } from 'lucide-react';
import { TokenService, api } from '../services/api';
import logoImg from '../assets/logo.png';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: 'home' | 'monitor' | 'incidents' | 'users' | 'installations' | 'operations' | 'audit';
  onTabChange: (tab: 'home' | 'monitor' | 'incidents' | 'users' | 'installations' | 'operations' | 'audit') => void;
  title: string;
}

export default function DashboardLayout({ children, activeTab, onTabChange, title }: DashboardLayoutProps) {
  const [user, setUser] = useState<any>(TokenService.getUser());
  const [showAnuncioModal, setShowAnuncioModal] = useState(false);
  const [anuncioMensaje, setAnuncioMensaje] = useState('');
  const [enviandoAnuncio, setEnviandoAnuncio] = useState(false);

  // Profile modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'info' | 'password'>('info');
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editProfileUrl, setEditProfileUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => {
    if (showProfileModal && user) {
      setEditFullName(user.fullName || '');
      setEditUsername(user.username || user.email || '');
      setEditPhone((user.phoneNumber || '').replace('+56 ', '').replace('+56', ''));
      setEditProfileUrl(user.profileImageUrl || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setProfileError('');
      setProfileSuccess('');
      setActiveProfileTab('info');
    }
  }, [showProfileModal, user]);

  // Camera & File upload handlers
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400, facingMode: 'user' } });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Error playing video stream:", e));
        }
      }, 100);
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      setProfileError("No se pudo acceder a la cámara. Por favor verifica los permisos.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const video = videoRef.current;
        const size = Math.min(video.videoWidth, video.videoHeight);
        const x = (video.videoWidth - size) / 2;
        const y = (video.videoHeight - size) / 2;
        ctx.drawImage(video, x, y, size, size, 0, 0, 120, 120);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // Redimensionado a 120x120 y comprimido a 70%
        setEditProfileUrl(dataUrl);
      }
      stopCamera();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const img = new Image();
          img.src = event.target.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 120;
            canvas.height = 120;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const size = Math.min(img.width, img.height);
              const x = (img.width - size) / 2;
              const y = (img.height - size) / 2;
              ctx.drawImage(img, x, y, size, size, 0, 0, 120, 120);
              const compressedUrl = canvas.toDataURL('image/jpeg', 0.7); // Redimensionado y comprimido
              setEditProfileUrl(compressedUrl);
              setProfileError("");
            }
          };
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const closeProfileModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setShowProfileModal(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName || !editUsername) {
      setProfileError('El nombre y el usuario son obligatorios.');
      return;
    }
    setUpdating(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const phoneFormatted = editPhone ? (editPhone.startsWith('+56') ? editPhone : `+56 ${editPhone}`) : '';
      const payload = {
        fullName: editFullName,
        username: editUsername,
        phoneNumber: phoneFormatted,
      };
      const userId = user?.userId || user?.id;
      await api.put(`/api/perfil/${userId}/datos`, payload);
      
      if (editProfileUrl !== (user?.profileImageUrl || '')) {
        if (editProfileUrl.startsWith('data:') || editProfileUrl.length > 300) {
          await api.patch(`/api/usuarios/${userId}/profile-image-upload`, { url: editProfileUrl });
        } else {
          await api.patch(`/api/usuarios/${userId}/profile-image?url=${encodeURIComponent(editProfileUrl)}`);
        }
      }

      const updatedUser = { 
        ...user, 
        fullName: editFullName, 
        username: editUsername, 
        email: editUsername, 
        phoneNumber: phoneFormatted,
        profileImageUrl: editProfileUrl 
      };
      TokenService.saveUser(updatedUser);
      setUser(updatedUser);
      setProfileSuccess('Perfil actualizado con éxito');
      setTimeout(() => closeProfileModal(), 1500);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Error al actualizar el perfil.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setProfileError('Todos los campos son obligatorios.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setProfileError('Las nuevas contraseñas no coinciden.');
      return;
    }
    setUpdating(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const payload = {
        currentPassword,
        newPassword
      };
      const userId = user?.userId || user?.id;
      await api.put(`/api/perfil/${userId}/contrasena`, payload);
      setProfileSuccess('Contraseña actualizada con éxito');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => closeProfileModal(), 1500);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Clave actual incorrecta o error al actualizar.');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const fetchFreshUser = async () => {
      try {
        const localUser = TokenService.getUser();
        if (localUser) {
          setUser(localUser);
          const userId = localUser.userId || localUser.id;
          if (userId) {
            const res = await api.get(`/api/usuarios/${userId}`);
            if (res.data) {
              const updatedUser = {
                ...localUser,
                profileImageUrl: res.data.profileImageUrl,
                fullName: res.data.fullName,
                email: res.data.email
              };
              TokenService.saveUser(updatedUser);
              setUser(updatedUser);
            }
          }
        }
      } catch (err) {
        console.warn('Error fetching fresh dashboard user data:', err);
      }
    };
    fetchFreshUser();
  }, []);

  const userRole = user?.role || 'SUPERVISOR';
  const userEmail = user?.email || user?.username || 'usuario@siscontrol.cl';
  const userInitial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';
  const userFirstName = user?.fullName ? user.fullName.split(' ')[0] : 'Usuario';

  const handleLogout = () => {
    TokenService.removeToken();
    window.location.href = '/login';
  };

  // === Notification Bell State ===
  const [pendingAlerts, setPendingAlerts] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/api/incidents');
        const pending = (res.data || []).filter((inc: any) => inc.status === 0);
        setPendingAlerts(pending.slice(0, 8));
      } catch (e) { /* silent */ }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSendAnuncio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anuncioMensaje.trim()) return;
    setEnviandoAnuncio(true);
    try {
      await api.post('/api/incidents/anuncio', {
        mensaje: anuncioMensaje,
        senderId: user?.userId || user?.id
      });
      alert('Aviso enviado con éxito a todos los dispositivos móviles');
      setShowAnuncioModal(false);
      setAnuncioMensaje('');
    } catch (err) {
      console.error(err);
      alert('Error al enviar el aviso administrativo');
    } finally {
      setEnviandoAnuncio(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        {/* LOGO — Agrandado */}
        <div style={styles.logoContainer}>
          <div style={{ ...styles.logoBadge, width: '52px', height: '52px' }}>
            <img src={logoImg} alt="SIS-Control Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          </div>
          <div style={styles.logoTextWrapper}>
            <span style={{ ...styles.logoTitle, fontSize: '18px' }}>SIS-CONTROL</span>
            <span style={styles.logoSubtitle}>Enterprise Security</span>
          </div>
        </div>

        {/* MENU */}
        <nav style={styles.menu}>
          <button 
            onClick={() => onTabChange('home')}
            style={{
              ...styles.menuItem,
              ...(activeTab === 'home' ? styles.menuItemActive : {})
            }}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>

          <button 
            onClick={() => onTabChange('monitor')}
            style={{
              ...styles.menuItem,
              ...(activeTab === 'monitor' ? styles.menuItemActive : {})
            }}
          >
            <MapPin size={20} />
            <span>Monitoreo en Vivo</span>
          </button>

          <button 
            onClick={() => onTabChange('incidents')}
            style={{
              ...styles.menuItem,
              ...(activeTab === 'incidents' ? styles.menuItemActive : {})
            }}
          >
            <AlertOctagon size={20} />
            <span>Alertas e Incidentes</span>
          </button>

          {(userRole === 'ADMIN' || userRole === 'SUPERVISOR') && (
            <button 
              onClick={() => onTabChange('operations')}
              style={{
                ...styles.menuItem,
                ...(activeTab === 'operations' ? styles.menuItemActive : {})
              }}
            >
              <Activity size={20} />
              <span>Consola de Operaciones</span>
            </button>
          )}

          {userRole === 'ADMIN' && (
            <>
              <button 
                onClick={() => onTabChange('users')}
                style={{
                  ...styles.menuItem,
                  ...(activeTab === 'users' ? styles.menuItemActive : {})
                }}
              >
                <Users size={20} />
                <span>Gestión de Usuarios</span>
              </button>

              <button 
                onClick={() => onTabChange('installations')}
                style={{
                  ...styles.menuItem,
                  ...(activeTab === 'installations' ? styles.menuItemActive : {})
                }}
              >
                <Building2 size={20} />
                <span>Instalaciones y Puntos</span>
              </button>

              <button 
                onClick={() => onTabChange('audit')}
                style={{
                  ...styles.menuItem,
                  ...(activeTab === 'audit' ? styles.menuItemActive : {})
                }}
              >
                <ClipboardList size={20} />
                <span>Auditoría (Logs)</span>
              </button>
            </>
          )}
        </nav>

        {/* PROFILE CARD & LOGOUT */}
        <div style={styles.sidebarFooter}>
          <div 
            style={{
              ...styles.profileCard,
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'background-color 0.2s',
            }}
            onClick={() => setShowProfileModal(true)}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            title="Configuración de Cuenta"
          >
            <div style={styles.profileAvatar}>
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Foto Perfil" style={styles.profileAvatarImage} />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>
            <div style={styles.profileInfo}>
              <span style={styles.profileName}>{userFirstName}</span>
              <span style={{
                ...styles.profileRole,
                ...(userRole === 'ADMIN' ? styles.roleAdmin : styles.roleSupervisor)
              }}>
                {userRole === 'ADMIN' ? 'Administrador' : userRole === 'GUARD' ? 'Guardia' : 'Supervisor'}
              </span>
            </div>
          </div>
          
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div style={styles.mainWrapper}>
        {/* HEADER */}
        <header style={styles.header}>
          <div style={styles.headerTitleWrapper}>
            <h2 style={styles.headerTitle}>{title}</h2>
          </div>
          
          <div style={styles.headerActions}>
            {/* Campana de Notificaciones Funcional */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button 
                style={styles.notificationBtn} 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                title="Notificaciones"
              >
                <Bell size={20} color="#94a3b8" />
                {pendingAlerts.length > 0 && (
                  <div style={styles.notificationDot}>
                    <span style={{ fontSize: '9px', fontWeight: '800', color: '#fff', lineHeight: '1' }}>
                      {pendingAlerts.length > 9 ? '9+' : pendingAlerts.length}
                    </span>
                  </div>
                )}
              </button>

              {showNotifDropdown && (
                <div style={{
                  position: 'absolute', top: '42px', right: 0, width: '360px',
                  backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                  zIndex: 1000, overflow: 'hidden',
                }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>Alertas Pendientes ({pendingAlerts.length})</span>
                    <button onClick={() => setShowNotifDropdown(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <X size={16} color="#64748b" />
                    </button>
                  </div>
                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {pendingAlerts.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>Sin alertas pendientes</div>
                    ) : (
                      pendingAlerts.map((alert: any) => (
                        <div 
                          key={alert.id} 
                          onClick={() => { onTabChange('incidents'); setShowNotifDropdown(false); }}
                          style={{
                            padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                            cursor: 'pointer', transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>{alert.title}</span>
                            <span style={{
                              fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px',
                              backgroundColor: alert.severity === 'ALTA' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)',
                              color: alert.severity === 'ALTA' ? '#ef4444' : '#eab308',
                            }}>{alert.severity}</span>
                          </div>
                          <span style={{ color: '#64748b', fontSize: '12px' }}>
                            {alert.clientTimestamp ? new Date(alert.clientTimestamp).toLocaleString('es-CL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : ''}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                  {pendingAlerts.length > 0 && (
                    <div 
                      onClick={() => { onTabChange('incidents'); setShowNotifDropdown(false); }}
                      style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', color: '#3b82f6', fontWeight: '600', fontSize: '13px' }}
                    >
                      Ver Todas las Alertas →
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={styles.divider}></div>

            {/* Botón de Aviso Administrativo */}
            {(userRole === 'ADMIN' || userRole === 'SUPERVISOR') && (
              <>
                <button 
                  onClick={() => setShowAnuncioModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    backgroundColor: '#d97706', color: '#fff', border: 'none',
                    borderRadius: '8px', padding: '8px 14px', fontSize: '13px',
                    fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b45309')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#d97706')}
                >
                  <Megaphone size={16} />
                  <span>Aviso Admin</span>
                </button>
                <div style={styles.divider}></div>
              </>
            )}

            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '8px',
                transition: 'background-color 0.2s',
              }}
              onClick={() => setShowProfileModal(true)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              title="Configuración de Cuenta"
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#F35C2B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                color: '#ffffff',
                fontSize: '14px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
              }}>
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="Foto Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
              <span style={styles.headerUserEmail}>{userEmail}</span>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main style={styles.content}>
          {children}
        </main>
      </div>

      {showAnuncioModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Emitir Aviso Administrativo</h3>
              <button onClick={() => setShowAnuncioModal(false)} style={styles.closeBtn} title="Cerrar" aria-label="Cerrar">
                <X size={20} color="#94a3b8" />
              </button>
            </div>

            <form onSubmit={handleSendAnuncio} style={styles.form}>
              <p style={{ color: '#94a3b8', fontSize: '13.5px', margin: 0, lineHeight: '1.5' }}>
                Este mensaje se enviará como una notificación prioritaria a todos los guardias activos en terreno y aparecerá destacado en sus aplicaciones.
              </p>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Mensaje del Anuncio</label>
                <textarea
                  value={anuncioMensaje}
                  onChange={(e) => setAnuncioMensaje(e.target.value)}
                  placeholder="ej. Reunión obligatoria de cambio de turno a las 18:00 hrs..."
                  required
                  rows={4}
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px', color: '#fff', padding: '12px', fontSize: '14px',
                    fontFamily: 'inherit', outline: 'none', resize: 'vertical', width: '100%',
                  }}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowAnuncioModal(false)} className="btn-secondary" style={styles.modalActionBtn}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={styles.modalActionBtn} disabled={enviandoAnuncio}>
                  {enviandoAnuncio ? 'Enviando...' : 'Emitir Comunicado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel" style={{ ...styles.modalContent, maxWidth: '460px' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={20} color="#3b82f6" />
                <h3 style={styles.modalTitle}>Configuración de Cuenta</h3>
              </div>
              <button onClick={closeProfileModal} style={styles.closeBtn} title="Cerrar" aria-label="Cerrar">
                <X size={20} color="#94a3b8" />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
              <button 
                type="button"
                onClick={() => { setActiveProfileTab('info'); setProfileError(''); setProfileSuccess(''); }}
                style={{
                  flex: 1, padding: '12px', border: 'none', background: 'none', cursor: 'pointer',
                  color: activeProfileTab === 'info' ? '#3b82f6' : '#94a3b8',
                  borderBottom: activeProfileTab === 'info' ? '2px solid #3b82f6' : 'none',
                  fontWeight: '600', fontSize: '14px',
                }}
              >
                Datos Personales
              </button>
              <button 
                type="button"
                onClick={() => { setActiveProfileTab('password'); setProfileError(''); setProfileSuccess(''); }}
                style={{
                  flex: 1, padding: '12px', border: 'none', background: 'none', cursor: 'pointer',
                  color: activeProfileTab === 'password' ? '#3b82f6' : '#94a3b8',
                  borderBottom: activeProfileTab === 'password' ? '2px solid #3b82f6' : 'none',
                  fontWeight: '600', fontSize: '14px',
                }}
              >
                Seguridad
              </button>
            </div>

            {profileError && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: '8px', fontSize: '13.5px', marginBottom: '16px', border: '1px solid rgba(239,68,68,0.15)' }}>
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#34d399', borderRadius: '8px', fontSize: '13.5px', marginBottom: '16px', border: '1px solid rgba(16,185,129,0.15)' }}>
                {profileSuccess}
              </div>
            )}

            {activeProfileTab === 'info' ? (
              <form onSubmit={handleUpdateProfile} style={styles.form}>
                {showCamera ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%', marginBottom: '20px' }}>
                    <div style={{ width: '200px', height: '200px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #3b82f6', backgroundColor: '#000' }}>
                      <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="button" onClick={capturePhoto} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12.5px' }}>
                        Capturar
                      </button>
                      <button type="button" onClick={stopCamera} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12.5px' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{
                      width: '76px', height: '76px', borderRadius: '50%', backgroundColor: '#F35C2B',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '700', color: '#ffffff', fontSize: '28px', border: '2px solid #10b981',
                      overflow: 'hidden', marginBottom: '12px', position: 'relative'
                    }}>
                      {editProfileUrl ? (
                        <img src={editProfileUrl} alt="Foto Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>{userInitial}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          color: '#fff',
                          padding: '6px 12px',
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: '600'
                        }}
                      >
                        <Upload size={14} /> Subir Foto
                      </button>
                      <button
                        type="button"
                        onClick={startCamera}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          color: '#fff',
                          padding: '6px 12px',
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: '600'
                        }}
                      >
                        <Camera size={14} /> Tomar Foto
                      </button>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Rol: {userRole}</span>
                  </div>
                )}

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nombre Completo</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nombre de Usuario / Email</label>
                  <input
                    type="email"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Teléfono</label>
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                    <span style={{ padding: '0 12px', color: '#94a3b8', fontSize: '14px', borderRight: '1px solid rgba(255, 255, 255, 0.06)' }}>+56</span>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 9))}
                      placeholder="912345678"
                      style={{ ...styles.input, border: 'none', backgroundColor: 'transparent', margin: 0 }}
                    />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>URL Imagen de Perfil (Opcional)</label>
                  <input
                    type="text"
                    value={editProfileUrl}
                    onChange={(e) => setEditProfileUrl(e.target.value)}
                    placeholder="https://ejemplo.com/foto.jpg"
                    style={styles.input}
                  />
                </div>

                <div style={styles.modalActions}>
                  <button type="button" onClick={closeProfileModal} className="btn-secondary" style={styles.modalActionBtn}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" style={styles.modalActionBtn} disabled={updating}>
                    {updating ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleUpdatePassword} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Contraseña Actual</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    style={styles.input}
                    placeholder="••••••••"
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nueva Contraseña</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={styles.input}
                    placeholder="••••••••"
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={styles.input}
                    placeholder="••••••••"
                  />
                </div>

                <div style={styles.modalActions}>
                  <button type="button" onClick={closeProfileModal} className="btn-secondary" style={styles.modalActionBtn}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" style={styles.modalActionBtn} disabled={updating}>
                    {updating ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#030712',
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#080c14',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    padding: '24px 16px',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
    paddingLeft: '8px',
  },
  logoBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'rgba(29, 78, 216, 0.1)',
    border: '1px solid rgba(29, 78, 216, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTextWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  logoTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '1.2px',
  },
  logoSubtitle: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '500',
  },
  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    borderRadius: '10px',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    fontSize: '14.5px',
    fontWeight: '500',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'color var(--transition-fast), background-color var(--transition-fast)',
  },
  menuItemActive: {
    backgroundColor: 'rgba(29, 78, 216, 0.1)',
    color: '#3b82f6',
    border: '1px solid rgba(29, 78, 216, 0.15)',
  },
  sidebarFooter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  },
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px',
  },
  profileAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    color: '#ffffff',
    fontSize: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  profileName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
  },
  profileRole: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '12px',
    width: 'fit-content',
  },
  roleAdmin: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.15)',
  },
  roleSupervisor: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.15)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '10px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#f87171',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
  },
  mainWrapper: {
    flex: 1,
    paddingLeft: '260px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  header: {
    height: '70px',
    backgroundColor: '#080c14',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    position: 'sticky',
    top: 0,
    zIndex: 90,
  },
  headerTitleWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  notificationBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
  },
  notificationDot: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    minWidth: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: '1px',
    height: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerUserEmail: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: '32px',
    position: 'relative',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    width: '100%',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    textAlign: 'left',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '4px',
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#ffffff',
    padding: '10px 14px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    width: '100%',
  },
  modalActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
    width: '100%',
  },
  modalActionBtn: {
    padding: '10px 20px',
    fontSize: '14px',
  },
};
