import React, { useEffect, useState } from 'react';
import { api, TokenService } from '../services/api';
import { Users, UserPlus, ToggleLeft, ToggleRight, Edit, Loader2, Search, X, Mail, ShieldAlert } from 'lucide-react';

interface User {
  id: number;
  fullName: string;
  rut: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'GUARD';
  status: number; // 1 = Activo, 0 = Inactivo
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  
  // Campos del formulario
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'SUPERVISOR' | 'GUARD'>('GUARD');
  const [rut, setRut] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const currentUser = TokenService.getUser();
  const currentUserId = currentUser?.userId || 1;

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/usuarios');
      setUsers(res.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Abrir modal para crear
  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingUserId(null);
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRut('');
    setRole('GUARD');
    setFormError(null);
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleOpenEdit = (user: User) => {
    setModalMode('edit');
    setEditingUserId(user.id);
    setFullName(user.fullName);
    setUsername(user.username);
    setEmail(user.email);
    setPassword(''); // La contraseña se deja vacía al editar a menos que se desee cambiar
    setRut(user.rut || '');
    setRole(user.role);
    setFormError(null);
    setShowModal(true);
  };

  // Guardar formulario (Crear o Editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      if (modalMode === 'create') {
        if (!password) {
          setFormError('La contraseña es obligatoria para nuevos usuarios.');
          setFormLoading(false);
          return;
        }

        // POST /api/usuarios?creatorId={creatorId}
        const res = await api.post(`/api/usuarios?creatorId=${currentUserId}`, {
          fullName,
          rut,
          username,
          email,
          password,
          role,
        });

        if (res.data) {
          setUsers(prev => [...prev, res.data]);
          setShowModal(false);
        }
      } else {
        // PUT /api/usuarios/{id}?editorId={editorId}
        const res = await api.put(`/api/usuarios/${editingUserId}?editorId=${currentUserId}`, {
          fullName,
          rut,
          username,
          email,
          ...(password ? { password } : {}), // Solo enviar si se ingresó
          role,
        });

        if (res.data) {
          setUsers(prev => prev.map(u => u.id === editingUserId ? res.data : u));
          setShowModal(false);
        }
      }
    } catch (err: any) {
      console.error('Error saving user:', err);
      if (err.response && err.response.data && err.response.data.error) {
        setFormError(err.response.data.error);
      } else {
        setFormError('Error al guardar el usuario. Verifica los datos.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Cambiar estado Activo/Inactivo (Toggle Status)
  const handleToggleStatus = async (userId: number) => {
    setActionLoadingId(userId);
    try {
      // PATCH /api/usuarios/{id}/toggle-status?editorId={editorId}
      const res = await api.patch(`/api/usuarios/${userId}/toggle-status?editorId=${currentUserId}`);
      if (res.data) {
        setUsers(prev => 
          prev.map(u => u.id === userId ? { ...u, status: res.data.status } : u)
        );
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      alert('No se pudo modificar el estado del usuario.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtrar lista
  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={styles.container}>
      {/* BARRA SUPERIOR DE ACCIONES */}
      <div className="glass-panel" style={styles.actionHeader}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#64748b" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar usuario por nombre, email o rol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-premium"
            style={styles.searchInputPremium}
          />
        </div>

        <button onClick={handleOpenCreate} className="btn-primary">
          <UserPlus size={18} />
          <span>Agregar Nuevo Usuario</span>
        </button>
      </div>

      {/* LISTA/TABLA DE USUARIOS */}
      {loading ? (
        <div style={styles.loaderWrapper}>
          <Loader2 size={36} className="spin-animation" color="#3b82f6" />
          <p style={styles.loadingText}>Cargando usuarios...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="glass-panel" style={styles.emptyState}>
          <Users size={48} color="#475569" />
          <h4 style={styles.emptyTitle}>Sin usuarios registrados</h4>
          <p style={styles.emptyDesc}>
            No se encontraron cuentas asociadas.
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Nombre Completo</th>
                <th style={styles.th}>Usuario / Email</th>
                <th style={styles.th}>Rol de Cuenta</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.thCenter}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} style={styles.tableRow}>
                  <td style={styles.td}>#{user.id}</td>
                  <td style={styles.tdName}>{user.fullName}</td>
                  <td style={styles.td}>
                    <div style={styles.emailBadge}>
                      <Mail size={12} color="#64748b" />
                      <span>{user.email || user.username}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.roleBadge,
                      ...(user.role === 'ADMIN' ? styles.badgeAdmin : {}),
                      ...(user.role === 'SUPERVISOR' ? styles.badgeSupervisor : {}),
                      ...(user.role === 'GUARD' ? styles.badgeGuard : {})
                    }}>
                      {user.role === 'ADMIN' ? 'Administrador' : user.role === 'SUPERVISOR' ? 'Supervisor' : 'Guardia'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.statusRow}>
                      <div style={{
                        ...styles.statusDot,
                        backgroundColor: user.status === 1 ? '#10b981' : '#ef4444'
                      }}></div>
                      <span>{user.status === 1 ? 'Activo' : 'Desactivado'}</span>
                    </div>
                  </td>
                  <td style={styles.tdCenter}>
                    <div style={styles.actionWrapper}>
                      {/* Editar */}
                      <button 
                        onClick={() => handleOpenEdit(user)}
                        style={styles.editBtn}
                        title="Editar cuenta"
                        aria-label="Editar cuenta"
                      >
                        <Edit size={16} />
                      </button>
                      
                      {/* Toggle status */}
                      <button 
                        onClick={() => handleToggleStatus(user.id)}
                        style={styles.toggleBtn}
                        disabled={actionLoadingId === user.id}
                        title={user.status === 1 ? 'Desactivar cuenta' : 'Activar cuenta'}
                        aria-label={user.status === 1 ? 'Desactivar cuenta' : 'Activar cuenta'}
                      >
                        {actionLoadingId === user.id ? (
                          <Loader2 size={16} className="spin-animation" color="#3b82f6" />
                        ) : user.status === 1 ? (
                          <ToggleRight size={24} color="#10b981" />
                        ) : (
                          <ToggleLeft size={24} color="#ef4444" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE CREAR / EDITAR */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {modalMode === 'create' ? 'Registrar Nuevo Usuario' : 'Editar Cuenta de Usuario'}
              </h3>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn} title="Cerrar modal" aria-label="Cerrar modal">
                <X size={20} color="#94a3b8" />
              </button>
            </div>

            {formError && (
              <div style={styles.errorAlert}>
                <ShieldAlert size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nombre Completo</label>
                <input
                  type="text"
                  placeholder="ej. Diego Portales"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-premium"
                  required
                />
              </div>

              <div style={styles.grid2}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>RUT (Formato: 12345678-K)</label>
                  <input
                    type="text"
                    placeholder="ej. 12345678-K"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    className="input-premium"
                    required
                    maxLength={12}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nombre de Usuario</label>
                  <input
                    type="text"
                    placeholder="ej. dportales"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-premium"
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="ej. diego@siscontrol.cl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-premium"
                    required
                  />
                </div>
              </div>

              <div style={styles.grid2}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Contraseña {modalMode === 'edit' && '(dejar vacío para no cambiar)'}</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-premium"
                    required={modalMode === 'create'}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Rol en la Plataforma</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="input-premium"
                    style={styles.formSelect}
                    title="Seleccionar rol de usuario"
                    aria-label="Seleccionar rol de usuario"
                  >
                    <option value="GUARD">Guardia de Seguridad</option>
                    <option value="SUPERVISOR">Supervisor de Turno</option>
                    <option value="ADMIN">Administrador del Sistema</option>
                  </select>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={styles.modalActionBtn}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={styles.modalActionBtn} disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <Loader2 size={16} className="spin-animation" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Usuario'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  actionHeader: {
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    flexWrap: 'wrap',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  searchWrapper: {
    position: 'relative',
    flex: 1,
    minWidth: '280px',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
  },
  loaderWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 0',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  tableCard: {
    padding: '8px',
    overflowX: 'auto',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  tableHeaderRow: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  th: {
    padding: '16px 20px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tableRow: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
    transition: 'background-color var(--transition-fast)',
  },
  td: {
    padding: '16px 20px',
    fontSize: '13.5px',
    color: '#94a3b8',
  },
  emailBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#94a3b8',
  },
  roleBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.5px',
    width: 'fit-content',
    display: 'inline-block',
  },
  badgeAdmin: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.15)',
  },
  badgeSupervisor: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.15)',
  },
  badgeGuard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: '#3b82f6',
    border: '1px solid rgba(59, 130, 246, 0.15)',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#ffffff',
    fontWeight: '600',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  actionWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  editBtn: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    transition: 'background-color var(--transition-fast)',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modalContent: {
    width: '90%',
    maxWidth: '560px',
    padding: '30px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '20px',
    color: '#f87171',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
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
  formSelect: {
    cursor: 'pointer',
    outline: 'none',
    height: '46px',
  },
  modalActions: {
    display: 'flex',
    gap: '16px',
    marginTop: '10px',
  },
  searchInputPremium: {
    paddingLeft: '44px',
  },
  loadingText: {
    marginTop: '12px',
    color: '#94a3b8',
  },
  emptyTitle: {
    color: '#ffffff',
    marginTop: '16px',
    fontWeight: '700',
  },
  emptyDesc: {
    color: '#64748b',
    fontSize: '13.5px',
    marginTop: '6px',
  },
  thCenter: {
    padding: '16px 20px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    textAlign: 'center',
  },
  tdName: {
    padding: '16px 20px',
    fontSize: '14px',
    color: '#ffffff',
    borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
    fontWeight: '700',
  },
  tdCenter: {
    padding: '16px 20px',
    fontSize: '14px',
    color: '#94a3b8',
    borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
    textAlign: 'center',
  },
  modalTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '18px',
  },
  modalActionBtn: {
    flex: 1,
  },
};
