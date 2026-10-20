import React, { useEffect, useState } from 'react';
import { api, TokenService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  ShieldAlert, Loader2, Users, MapPin, 
  RefreshCw, CheckCircle2, AlertTriangle, X, Send, Activity, Plus, Smartphone
} from 'lucide-react';

interface ActiveShift {
  id: number;
  guardName: string;
  location: string;
  entryTime: string;
  latitude: number | null;
  longitude: number | null;
}

interface ActiveRound {
  id: number;
  guardName: string;
  location: string;
  progreso: number;
  statusDisplay: string;
  status: string;
}

export default function SupervisorConsole() {
  const toast = useToast();
  const [activeShifts, setActiveShifts] = useState<ActiveShift[]>([]);
  const [activeRounds, setActiveRounds] = useState<ActiveRound[]>([]);
  
  // KPIs
  const [kpis, setKpis] = useState({
    activeShiftsCount: 0,
    roundsInProgress: 0,
    roundsCompleted: 0,
    totalIncidents: 0
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Modales
  const [showCancelRoundModal, setShowCancelRoundModal] = useState(false);
  const [selectedRoundToCancel, setSelectedRoundToCancel] = useState<ActiveRound | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Estados Modal Asignar Turno e Instalación (Push Notifications)
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [guardsList, setGuardsList] = useState<any[]>([]);
  const [installationsList, setInstallationsList] = useState<any[]>([]);
  const [selectedGuardId, setSelectedGuardId] = useState<number | ''>('');
  const [selectedInstallationId, setSelectedInstallationId] = useState<number | ''>('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignModalLoading, setAssignModalLoading] = useState(false);
  const [assignError, setAssignError] = useState('');

  const currentUser = TokenService.getUser();
  const userRole = currentUser?.role || 'SUPERVISOR';
  const editorId = currentUser?.userId || currentUser?.id || 1;

  // Abrir modal de asignación y cargar guardias e instalaciones
  const handleOpenAssignModal = async () => {
    setShowAssignModal(true);
    setAssignError('');
    setAssignModalLoading(true);
    try {
      const [resGuards, resInst] = await Promise.all([
        api.get('/api/usuarios/role/GUARD'),
        api.get('/api/instalaciones')
      ]);
      const guards = Array.isArray(resGuards.data) ? resGuards.data : [];
      const insts = (Array.isArray(resInst.data) ? resInst.data : []).filter((i: any) => i.status === 1);
      setGuardsList(guards);
      setInstallationsList(insts);
      if (guards.length > 0) setSelectedGuardId(guards[0].id);
      if (insts.length > 0) setSelectedInstallationId(insts[0].id);
    } catch (err) {
      console.error('Error fetching guards/installations:', err);
      setAssignError('Error al cargar la lista de guardias e instalaciones.');
    } finally {
      setAssignModalLoading(false);
    }
  };

  // Confirmar asignación de turno con despacho de notificación Push
  const handleConfirmAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuardId || !selectedInstallationId) {
      setAssignError('Debes seleccionar un guardia y una instalación.');
      return;
    }

    try {
      setAssignLoading(true);
      setAssignError('');
      const res = await api.post('/api/supervisor-guard/asignar-turno', {
        supervisorId: editorId,
        guardId: Number(selectedGuardId),
        installationId: Number(selectedInstallationId),
        notas: assignNotes.trim()
      });

      toast.success(res.data?.mensaje || 'Turno e instalación asignados exitosamente con alerta Push enviada.');
      setShowAssignModal(false);
      setAssignNotes('');
      await fetchDashboardData(false);
    } catch (err: any) {
      console.error('Error assigning shift/installation:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Error al procesar la asignación.';
      setAssignError(msg);
    } finally {
      setAssignLoading(false);
    }
  };

  // Cargar datos del dashboard correspondientes
  const fetchDashboardData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const endpoint = userRole === 'ADMIN' 
        ? '/api/reportes/dashboard-admin' 
        : `/api/reportes/dashboard-supervisor/${editorId}`;

      const res = await api.get(endpoint);
      const data = res.data;

      if (data) {
        setActiveShifts(data.activeShiftsList || []);
        setActiveRounds(data.activeRoundsList || []);
        setKpis({
          activeShiftsCount: data.activeShiftsCount || 0,
          roundsInProgress: data.roundsInProgress || 0,
          roundsCompleted: data.roundsCompleted || 0,
          totalIncidents: data.totalIncidents || 0
        });
      }
    } catch (err) {
      console.error('Error fetching supervisor operations data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);

    // Auto-actualizar cada 20 segundos
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  // Forzar cierre de jornada
  const handleForceCloseShift = async (shift: ActiveShift) => {
    const confirmClose = window.confirm(
      `¿Estás seguro de que deseas finalizar la jornada activa del guardia ${shift.guardName}? Esta acción registrará su salida administrativamente.`
    );
    if (!confirmClose) return;

    try {
      setActionLoadingId(shift.id);
      await api.put(`/api/rondas/jornada/cancelar/${shift.id}?adminId=${editorId}`);
      await fetchDashboardData(false);
      toast.success(`Jornada del guardia ${shift.guardName} cerrada administrativamente.`);
    } catch (err) {
      console.error('Error closing shift administratively:', err);
      toast.error('Error al cerrar la jornada. Inténtalo de nuevo.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Abrir modal de cancelación de ronda
  const handleOpenCancelRound = (round: ActiveRound) => {
    setSelectedRoundToCancel(round);
    setCancelReason('');
    setModalError('');
    setShowCancelRoundModal(true);
  };

  // Ejecutar cancelación de ronda
  const handleConfirmCancelRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoundToCancel) return;
    if (!cancelReason.trim()) {
      setModalError('Debes ingresar un motivo de cierre obligatorio.');
      return;
    }

    try {
      setModalLoading(true);
      setModalError('');
      
      await api.put(
        `/api/rondas/cancelar/${selectedRoundToCancel.id}?adminId=${editorId}&motivo=${encodeURIComponent(cancelReason)}`
      );

      setShowCancelRoundModal(false);
      await fetchDashboardData(false);
    } catch (err) {
      console.error('Error cancelling round administratively:', err);
      setModalError('Error al procesar el cierre. Verifica la conexión con el servidor.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      
      {/* SECCIÓN SUPERIOR: PANEL DE CONTROL Y REFRESCO */}
      <div style={styles.topBar}>
        <div style={styles.kpiGrid}>
          <div className="glass-card" style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>Guardias Activos</span>
              <Users size={18} color="#3b82f6" />
            </div>
            <strong style={styles.kpiVal}>{kpis.activeShiftsCount}</strong>
          </div>

          <div className="glass-card" style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>Rondas en Progreso</span>
              <Activity size={18} color="#10b981" />
            </div>
            <strong style={styles.kpiVal}>{kpis.roundsInProgress}</strong>
          </div>

          <div className="glass-card" style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>Rondas Completadas Hoy</span>
              <CheckCircle2 size={18} color="#eab308" />
            </div>
            <strong style={styles.kpiVal}>{kpis.roundsCompleted}</strong>
          </div>

          <div className="glass-card" style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>Incidentes Reportados</span>
              <AlertTriangle size={18} color="#ef4444" />
            </div>
            <strong style={styles.kpiVal}>{kpis.totalIncidents}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleOpenAssignModal}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px' }}
            title="Asignar turno e instalación y notificar por Push"
          >
            <Plus size={16} />
            <span>Asignar Turno (Push)</span>
          </button>

          <button 
            onClick={() => fetchDashboardData(false)}
            className="btn-secondary"
            style={styles.refreshBtn}
            disabled={refreshing}
            title="Sincronizar consola de operaciones"
            aria-label="Sincronizar consola de operaciones"
          >
            <RefreshCw size={14} className={refreshing ? 'spin-animation' : ''} />
            <span>{refreshing ? 'Actualizando...' : 'Sincronizar'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={styles.loaderContainer}>
          <Loader2 size={36} className="spin-animation" color="#3b82f6" />
          <p style={styles.loaderText}>Cargando estado operacional en vivo...</p>
        </div>
      ) : (
        <div style={styles.columnsGrid}>
          
          {/* PANEL 1: CONTROL DE ASISTENCIA Y JORNADAS */}
          <div className="glass-panel" style={styles.panel}>
            <div style={styles.panelHeader}>
              <Users size={18} color="#3b82f6" />
              <h4 style={styles.panelTitle}>Personal de Guardia de Turno ({activeShifts.length})</h4>
            </div>

            <div style={styles.listScroll}>
              {activeShifts.length === 0 ? (
                <div style={styles.emptyState}>
                  <Users size={32} color="#475569" />
                  <p style={styles.emptyText}>Sin personal activo registrado.</p>
                  <span style={styles.emptySub}>Las jornadas en curso del personal aparecerán aquí cuando marquen entrada.</span>
                </div>
              ) : (
                activeShifts.map((shift) => (
                  <div key={shift.id} className="glass-card" style={styles.opCard}>
                    <div style={styles.opCardHeader}>
                      <div>
                        <strong style={styles.guardName}>{shift.guardName}</strong>
                        <div style={styles.instLabel}>
                          <MapPin size={11} color="#64748b" />
                          <span style={styles.instName}>{shift.location}</span>
                        </div>
                      </div>
                      <span style={styles.entryBadge}>Entrada: {shift.entryTime} hrs</span>
                    </div>

                    <div style={styles.opCardFooter}>
                      {shift.latitude && shift.longitude ? (
                        <span style={styles.gpsBadge}>
                          📍 GPS: {shift.latitude.toFixed(4)}, {shift.longitude.toFixed(4)}
                        </span>
                      ) : (
                        <span style={styles.noGpsBadge}>GPS: No Disponible</span>
                      )}

                      <button 
                        onClick={() => handleForceCloseShift(shift)}
                        style={styles.closeShiftBtn}
                        disabled={actionLoadingId === shift.id}
                        title="Finalizar turno del guardia administrativamente"
                        aria-label="Finalizar turno del guardia administrativamente"
                      >
                        {actionLoadingId === shift.id ? (
                          <Loader2 size={12} className="spin-animation" />
                        ) : (
                          'Finalizar Turno'
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PANEL 2: AUDITORÍA Y CIERRE DE RONDAS */}
          <div className="glass-panel" style={styles.panel}>
            <div style={styles.panelHeader}>
              <Activity size={18} color="#10b981" />
              <h4 style={styles.panelTitle}>Patrullajes y Rondas en Curso ({activeRounds.length})</h4>
            </div>

            <div style={styles.listScroll}>
              {activeRounds.length === 0 ? (
                <div style={styles.emptyState}>
                  <Activity size={32} color="#475569" />
                  <p style={styles.emptyText}>No hay rondas activas en progreso.</p>
                  <span style={styles.emptySub}>Los guardias en ronda se auditan y listan en tiempo real en este panel.</span>
                </div>
              ) : (
                activeRounds.map((round) => (
                  <div key={round.id} className="glass-card" style={styles.opCard}>
                    <div style={styles.opCardHeader}>
                      <div>
                        <strong style={styles.guardName}>{round.guardName}</strong>
                        <div style={styles.instLabel}>
                          <MapPin size={11} color="#64748b" />
                          <span style={styles.instName}>{round.location}</span>
                        </div>
                      </div>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: round.status === 'PANICO' || round.status === 'SOS' 
                          ? 'rgba(239, 68, 68, 0.15)' 
                          : 'rgba(59, 130, 246, 0.1)'
                      }}>
                        {round.statusDisplay}
                      </span>
                    </div>

                    {/* BARRA DE PROGRESO */}
                    <div style={styles.progressSection}>
                      <div style={styles.progressTextRow}>
                        <span style={styles.progressLabel}>Progreso de Puntos</span>
                        <span style={styles.progressPercent}>{Math.round(round.progreso)}%</span>
                      </div>
                      <div style={styles.progressBarBg}>
                        <div style={{
                          ...styles.progressBarFill,
                          width: `${round.progreso}%`,
                          backgroundColor: round.status === 'PANICO' || round.status === 'SOS' ? '#ef4444' : '#10b981'
                        }}></div>
                      </div>
                    </div>

                    <div style={styles.opCardFooter}>
                      <span style={styles.roundIdText}>Ronda ID: #{round.id}</span>
                      <button 
                        onClick={() => handleOpenCancelRound(round)}
                        style={styles.cancelRoundBtn}
                        title="Finalizar ronda administrativamente"
                        aria-label="Finalizar ronda administrativamente"
                      >
                        Cerrar Ronda
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* ==========================================================================
         MODAL DE CANCELACIÓN / FORZAR CIERRE DE RONDA
         ========================================================================== */}
      {showCancelRoundModal && selectedRoundToCancel && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleRow}>
                <ShieldAlert size={20} color="#ef4444" />
                <h3 style={styles.modalTitle}>Cierre Administrativo de Ronda</h3>
              </div>
              <button onClick={() => setShowCancelRoundModal(false)} style={styles.closeBtn} title="Cerrar modal" aria-label="Cerrar modal">
                <X size={20} color="#94a3b8" />
              </button>
            </div>

            <p style={styles.modalWarnDesc}>
              Vas a forzar el cierre y finalización de la ronda de <strong>{selectedRoundToCancel.guardName}</strong> en la sede <strong>{selectedRoundToCancel.location}</strong>. Esta acción detendrá el registro y marcará la ronda como concluida.
            </p>

            {modalError && (
              <div style={styles.errorAlert}>
                <AlertTriangle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmCancelRound} style={styles.modalForm}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Motivo / Justificación Obligatoria</label>
                <textarea 
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ej: Falla física de lector NFC / Guardia se retira por urgencia médica / Cierre por anomalía justificada."
                  className="input-premium"
                  style={styles.textarea}
                  required
                />
              </div>

              <div style={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => setShowCancelRoundModal(false)} 
                  className="btn-secondary" 
                  style={styles.modalActionBtn}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ ...styles.modalActionBtn, backgroundColor: '#ef4444', borderColor: '#ef4444' }} 
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <>
                      <Loader2 size={16} className="spin-animation" />
                      <span>Confirmando...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Cerrar Ronda</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
         MODAL DE ASIGNACIÓN DE TURNO E INSTALACIÓN (PUSH NOTIFICATIONS)
         ========================================================================== */}
      {showAssignModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel" style={{ ...styles.modalContent, maxWidth: '520px' }}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleRow}>
                <Smartphone size={20} color="#3b82f6" />
                <h3 style={styles.modalTitle}>Asignar Turno e Instalación</h3>
              </div>
              <button onClick={() => setShowAssignModal(false)} style={styles.closeBtn} title="Cerrar modal" aria-label="Cerrar modal">
                <X size={20} color="#94a3b8" />
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              marginBottom: '16px'
            }}>
              <Send size={18} color="#60a5fa" />
              <p style={{ margin: 0, fontSize: '12.5px', color: '#bfdbfe', lineHeight: 1.4 }}>
                Al asignar, se enviará una <strong>Notificación Push Nativa</strong> instantánea al smartphone del guardia indicándole su sede y turno.
              </p>
            </div>

            {assignError && (
              <div style={styles.errorAlert}>
                <AlertTriangle size={16} />
                <span>{assignError}</span>
              </div>
            )}

            {assignModalLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '10px' }}>
                <Loader2 size={32} className="spin-animation" color="#3b82f6" />
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Cargando personal e instalaciones...</span>
              </div>
            ) : (
              <form onSubmit={handleConfirmAssign} style={styles.modalForm}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Guardia a Asignar</label>
                  <select
                    value={selectedGuardId}
                    onChange={(e) => setSelectedGuardId(Number(e.target.value))}
                    className="input-premium"
                    style={{ width: '100%' }}
                    required
                  >
                    {guardsList.length === 0 ? (
                      <option value="">No hay guardias disponibles</option>
                    ) : (
                      guardsList.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.fullName} ({g.rut || g.username})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Instalación / Sede</label>
                  <select
                    value={selectedInstallationId}
                    onChange={(e) => setSelectedInstallationId(Number(e.target.value))}
                    className="input-premium"
                    style={{ width: '100%' }}
                    required
                  >
                    {installationsList.length === 0 ? (
                      <option value="">No hay instalaciones activas</option>
                    ) : (
                      installationsList.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name} - {inst.address || 'Sin dirección'}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Instrucciones / Notas del Turno (Opcional)</label>
                  <textarea
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    placeholder="Ej: Cobertura de accesos peatonales, rondas cada 45 minutos."
                    className="input-premium"
                    style={styles.textarea}
                  />
                </div>

                <div style={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="btn-secondary"
                    style={styles.modalActionBtn}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={styles.modalActionBtn}
                    disabled={assignLoading}
                  >
                    {assignLoading ? (
                      <>
                        <Loader2 size={16} className="spin-animation" />
                        <span>Asignando y Notificando...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Asignar y Enviar Push</span>
                      </>
                    )}
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
    flexDirection: 'column',
    gap: '20px',
    height: 'calc(100vh - 140px)',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    flexWrap: 'wrap',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    flex: 1,
  },
  kpiCard: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  kpiHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  kpiLabel: {
    color: '#64748b',
    fontWeight: '600',
  },
  kpiVal: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#ffffff',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    fontSize: '13px',
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  columnsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    flex: 1,
    overflow: 'hidden',
  },
  panel: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    height: '100%',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '12px',
  },
  panelTitle: {
    fontSize: '14.5px',
    fontWeight: '700',
    color: '#ffffff',
  },
  listScroll: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
    flex: 1,
    paddingRight: '2px',
  },
  opCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderRadius: '12px',
  },
  opCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
  },
  guardName: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#ffffff',
  },
  instLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '4px',
  },
  instName: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  entryBadge: {
    fontSize: '11px',
    color: '#94a3b8',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: '600',
  },
  statusBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: '700',
    color: '#3b82f6',
    textTransform: 'uppercase',
  },
  opCardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.03)',
    paddingTop: '10px',
  },
  gpsBadge: {
    fontSize: '11.5px',
    color: '#64748b',
    fontFamily: 'monospace',
  },
  noGpsBadge: {
    fontSize: '11.5px',
    color: '#475569',
  },
  closeShiftBtn: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '6px',
    color: '#f87171',
    padding: '4px 10px',
    fontSize: '11.5px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
  },
  cancelRoundBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '6px',
    color: '#f87171',
    padding: '4px 10px',
    fontSize: '11.5px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
  },
  roundIdText: {
    fontSize: '11.5px',
    color: '#64748b',
    fontWeight: '500',
  },
  progressSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  progressTextRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11.5px',
  },
  progressLabel: {
    color: '#64748b',
  },
  progressPercent: {
    fontWeight: '700',
    color: '#cbd5e1',
  },
  progressBarBg: {
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.4s ease',
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: '12px',
  },
  loaderText: {
    fontSize: '13px',
    color: '#64748b',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: '12px',
    textAlign: 'center',
    padding: '24px',
  },
  emptyText: {
    fontSize: '13.5px',
    color: '#64748b',
    fontWeight: '600',
    marginTop: '6px',
  },
  emptySub: {
    fontSize: '11.5px',
    color: '#475569',
    maxWidth: '260px',
  },

  // Modal
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
    maxWidth: '480px',
    padding: '30px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  modalTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  modalTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '16.5px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  modalWarnDesc: {
    fontSize: '13px',
    color: '#cbd5e1',
    lineHeight: '1.5',
    marginBottom: '20px',
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
  modalForm: {
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
  textarea: {
    minHeight: '90px',
    resize: 'vertical',
  },
  modalActions: {
    display: 'flex',
    gap: '16px',
    marginTop: '10px',
  },
  modalActionBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
};
