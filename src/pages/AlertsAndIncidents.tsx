import { useEffect, useState } from 'react';
import { api, TokenService } from '../services/api';
import { AlertOctagon, ShieldAlert, CheckCircle, Search, Filter, Camera, X, Check, Loader2, MapPin, Clock, User } from 'lucide-react';

interface Incident {
  id: number;
  title: string;
  description: string;
  severity: string;
  type: string;
  imageUrl?: string;
  status: number; // 0 = Activo, 1 = Resuelto
  clientTimestamp: string;
  roundExecutionId?: number;
  latitude?: number;
  longitude?: number;
  managedByName?: string;
}

export default function AlertsAndIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // Cambiado a ALL por defecto para ver todo
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolvingNote, setResolvingNote] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [detailIncident, setDetailIncident] = useState<Incident | null>(null);

  const user = TokenService.getUser();

  const fetchIncidents = async () => {
    try {
      const res = await api.get('/api/incidents');
      setIncidents(res.data || []);
    } catch (err) {
      console.error('Error fetching incidents list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    // Actualización automática de incidentes cada 8 segundos (tiempo real simulado)
    const interval = setInterval(fetchIncidents, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenResolveModal = (incident: Incident) => {
    setSelectedIncident(incident);
    setResolvingNote('');
    setShowResolveModal(true);
  };

  const handleResolveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setResolvingId(selectedIncident.id);
    try {
      // PUT http://localhost:8080/api/incidents/{id}/status
      await api.put(`/api/incidents/${selectedIncident.id}/status`, {
        status: 1, // Marcar como Resuelto
        managedBy: user?.userId || 1,
      });

      // Actualizar la lista local
      setIncidents(prev => 
        prev.map(item => 
          item.id === selectedIncident.id 
            ? { ...item, status: 1, managedByName: user?.fullName || 'Administrador' } 
            : item
        )
      );
      setShowResolveModal(false);
      setSelectedIncident(null);
    } catch (err) {
      console.error('Error resolving alert:', err);
      alert('Error al resolver la alerta.');
    } finally {
      setResolvingId(null);
    }
  };

  // Filtrar incidentes
  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.title.toLowerCase().includes(search.toLowerCase()) || 
                          inc.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;
    
    const matchesStatus = statusFilter === 'ALL' || 
                          (statusFilter === '0' && inc.status === 0) || 
                          (statusFilter === '1' && inc.status === 1);

    const matchesType = typeFilter === 'ALL' || inc.type === typeFilter;

    return matchesSearch && matchesSeverity && matchesStatus && matchesType;
  });

  // Alertas SOS activas para la barra roja superior (tituladas como Pánico o similares)
  const activeSosAlerts = incidents.filter(inc => 
    inc.status === 0 && 
    (inc.title.toUpperCase().includes('PÁNICO') || inc.title.toUpperCase().includes('SOS'))
  );

  return (
    <div style={styles.container}>
      {/* SECCIÓN CRÍTICA DE ALERTAS SOS DE PÁNICO */}
      {activeSosAlerts.length > 0 && (
        <div className="sos-pulse-border" style={styles.sosAlertBanner}>
          <div style={styles.sosHeader}>
            <ShieldAlert size={26} color="#ffffff" className="spin-slow" />
            <div>
              <h3 style={styles.sosTitle}>EMERGENCIA: {activeSosAlerts.length} ALERTA(S) DE PÁNICO SOS ACTIVA(S)</h3>
              <p style={styles.sosSubtitle}>Los guardias han activado el botón de pánico en terreno por agitación de dispositivo o SOS manual.</p>
            </div>
          </div>

          <div style={styles.sosList}>
            {activeSosAlerts.map(alertItem => (
              <div key={alertItem.id} style={styles.sosItem}>
                <div style={styles.sosItemText}>
                  <strong style={styles.sosItemTitle}>{alertItem.title}</strong>
                  <p style={styles.sosItemDesc}>{alertItem.description}</p>
                  <span style={styles.sosItemTime}>Reportado a las: {new Date(alertItem.clientTimestamp).toLocaleTimeString()}</span>
                </div>
                <button 
                  onClick={() => handleOpenResolveModal(alertItem)}
                  style={styles.sosResolveBtn}
                >
                  <Check size={16} />
                  <span>Resolver SOS</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTROLES DE BÚSQUEDA Y FILTRADO */}
      <div className="glass-panel" style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#64748b" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por título o descripción del incidente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-premium"
            style={styles.searchInputPremium}
          />
        </div>

        <div style={styles.filtersGroup}>
          {/* Filtro Gravedad */}
          <div style={styles.filterItem}>
            <Filter size={16} color="#64748b" />
            <select 
              value={severityFilter} 
              onChange={(e) => setSeverityFilter(e.target.value)}
              style={styles.select}
              title="Filtrar por gravedad"
              aria-label="Filtrar por gravedad"
            >
              <option value="ALL">Todas las Gravedades</option>
              <option value="ALTA">Gravedad: Alta</option>
              <option value="MEDIA">Gravedad: Media</option>
              <option value="BAJA">Gravedad: Baja</option>
            </select>
          </div>

          {/* Filtro Estado */}
          <div style={styles.filterItem}>
            <CheckCircle size={16} color="#64748b" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.select}
              title="Filtrar por estado"
              aria-label="Filtrar por estado"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="0">Estado: Activos</option>
              <option value="1">Estado: Resueltos</option>
            </select>
          </div>

          {/* Filtro Tipo */}
          <div style={styles.filterItem}>
            <Filter size={16} color="#64748b" />
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              style={styles.select}
              title="Filtrar por tipo"
              aria-label="Filtrar por tipo"
            >
              <option value="ALL">Todos los Tipos</option>
              <option value="JORNADA">Asistencia / Jornada</option>
              <option value="RONDA">Recorridos / Ronda</option>
              <option value="MANTENCION">Omisiones de Checkpoint</option>
              <option value="ROBO">Robos</option>
              <option value="VANDALISMO">Vandalismo</option>
              <option value="HALLAZGO">Hallazgos</option>
              <option value="OTRO">Otros / Novedades</option>
            </select>
          </div>
        </div>
      </div>

      {/* GRILLA DE INCIDENTES */}
      {loading ? (
        <div style={styles.loaderWrapper}>
          <Loader2 size={36} className="spin-animation" color="#3b82f6" />
          <p style={{ marginTop: '12px', color: '#94a3b8' }}>Cargando novedades...</p>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="glass-panel" style={styles.emptyState}>
          <AlertOctagon size={48} color="#475569" />
          <h4 style={{ color: '#ffffff', marginTop: '16px', fontWeight: '700' }}>Sin Incidentes para Mostrar</h4>
          <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '6px' }}>
            No se encontraron reportes que coincidan con los filtros aplicados.
          </p>
        </div>
      ) : (
        <div style={styles.incidentsGrid}>
          {filteredIncidents.map((incident) => (
            <div 
              key={incident.id} 
              className="glass-card" 
              style={{ ...styles.incidentCard, cursor: 'pointer' }}
              onClick={() => setDetailIncident(incident)}
            >
              {/* Encabezado Tarjeta */}
              <div style={styles.cardHeader}>
                <div style={{
                  ...styles.severityBadge,
                  ...(incident.severity === 'ALTA' ? styles.badgeHigh : {}),
                  ...(incident.severity === 'MEDIA' ? styles.badgeMedium : {}),
                  ...(incident.severity === 'BAJA' ? styles.badgeLow : {})
                }}>
                  {incident.severity}
                </div>

                <div style={{
                  ...styles.typeBadge,
                  ...(incident.type === 'JORNADA' ? styles.badgeJornada : {}),
                  ...(incident.type === 'RONDA' ? styles.badgeRonda : {}),
                  ...(incident.type === 'MANTENCION' ? styles.badgeMantencion : {})
                }}>
                  {incident.type || 'Novedad'}
                </div>

                <div style={{
                  ...styles.statusBadge,
                  ...(incident.status === 1 ? styles.statusBadgeResolved : styles.statusBadgeActive)
                }}>
                  {incident.status === 1 ? 'Resuelto' : 'Activo'}
                </div>
              </div>

              {/* Título e Info */}
              <div style={styles.cardBody}>
                <h4 style={styles.incidentTitle}>{incident.title}</h4>
                <p style={styles.incidentDesc}>{incident.description}</p>
                <span style={styles.incidentDate}>
                  Reportado: {new Date(incident.clientTimestamp).toLocaleString()}
                </span>
              </div>

              {/* Imagen Adjunta */}
              {incident.imageUrl ? (
                <div style={styles.imageContainer} onClick={() => setZoomImage(incident.imageUrl!)}>
                  <img src={incident.imageUrl} alt={incident.title} style={styles.image} />
                  <div style={styles.imageOverlay}>
                    <Camera size={20} color="#ffffff" />
                    <span>Ver Imagen Ampliada</span>
                  </div>
                </div>
              ) : (
                <div style={styles.noImagePlaceholder}>
                  <Camera size={24} color="#334155" />
                  <span>Sin evidencia fotográfica</span>
                </div>
              )}

              {/* Pie de Tarjeta - Acciones */}
              {incident.status === 0 ? (
                <button 
                  onClick={() => handleOpenResolveModal(incident)}
                  style={styles.actionBtn}
                >
                  <CheckCircle size={16} />
                  <span>Resolver Incidente</span>
                </button>
              ) : (
                <div style={styles.resolvedInfo}>
                  <Check size={16} color="#10b981" />
                  <span>Resuelto por: {incident.managedByName || 'Supervisor'}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE RESOLUCIÓN DE ALERTAS */}
      {showResolveModal && selectedIncident && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Resolver Reporte Operativo</h3>
              <button onClick={() => setShowResolveModal(false)} style={styles.closeBtn} title="Cerrar modal" aria-label="Cerrar modal">
                <X size={20} color="#94a3b8" />
              </button>
            </div>
            
            <form onSubmit={handleResolveAlert} style={styles.modalForm}>
              <p style={styles.modalDesc}>
                Estás a punto de marcar como <strong>Resuelto</strong> la alerta:
              </p>
              <div style={styles.alertDetailBox}>
                <p style={styles.modalDetailTitle}>{selectedIncident.title}</p>
                <p style={styles.modalDetailDesc}>{selectedIncident.description}</p>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Observaciones / Notas de resolución (opcional)</label>
                <textarea
                  value={resolvingNote}
                  onChange={(e) => setResolvingNote(e.target.value)}
                  placeholder="Escribe comentarios sobre cómo se resolvió la situación..."
                  className="input-premium"
                  style={styles.textarea}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowResolveModal(false)} className="btn-secondary" style={styles.modalActionBtn}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={styles.modalActionBtn} disabled={resolvingId !== null}>
                  {resolvingId !== null ? (
                    <>
                      <Loader2 size={16} className="spin-animation" />
                      Resolviendo...
                    </>
                  ) : (
                    'Guardar Resolución'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE DE INCIDENTE */}
      {detailIncident && (
        <div style={styles.modalOverlay} onClick={() => setDetailIncident(null)}>
          <div className="glass-panel" style={{ ...styles.modalContent, maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Detalle del Incidente #{detailIncident.id}</h3>
              <button onClick={() => setDetailIncident(null)} style={styles.closeBtn} title="Cerrar" aria-label="Cerrar">
                <X size={20} color="#94a3b8" />
              </button>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <span style={{
                ...styles.severityBadge,
                ...(detailIncident.severity === 'ALTA' ? styles.badgeHigh : {}),
                ...(detailIncident.severity === 'MEDIA' ? styles.badgeMedium : {}),
                ...(detailIncident.severity === 'BAJA' ? styles.badgeLow : {})
              }}>{detailIncident.severity}</span>
              <span style={styles.typeBadge}>{detailIncident.type || 'Novedad'}</span>
              <span style={{
                ...styles.statusBadge,
                ...(detailIncident.status === 1 ? styles.statusBadgeResolved : styles.statusBadgeActive)
              }}>{detailIncident.status === 1 ? 'Resuelto' : 'Activo'}</span>
            </div>

            {/* Título y Descripción */}
            <h4 style={{ color: '#fff', fontWeight: '700', fontSize: '18px', marginBottom: '8px' }}>{detailIncident.title}</h4>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>{detailIncident.description}</p>

            {/* Metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                <Clock size={14} />
                <span>Reportado: {new Date(detailIncident.clientTimestamp).toLocaleString('es-CL')}</span>
              </div>
              {detailIncident.managedByName && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                  <User size={14} />
                  <span>Gestionado por: {detailIncident.managedByName}</span>
                </div>
              )}
              {(detailIncident.latitude && detailIncident.longitude) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                  <MapPin size={14} />
                  <span>Ubicación: {detailIncident.latitude.toFixed(4)}, {detailIncident.longitude.toFixed(4)}</span>
                </div>
              )}
              {detailIncident.roundExecutionId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                  <CheckCircle size={14} />
                  <span>Ronda #{detailIncident.roundExecutionId}</span>
                </div>
              )}
            </div>

            {/* Imagen */}
            {detailIncident.imageUrl ? (
              <div 
                style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '20px', cursor: 'pointer', maxHeight: '300px' }}
                onClick={() => { setZoomImage(detailIncident.imageUrl!); }}
              >
                <img src={detailIncident.imageUrl} alt="Evidencia" style={{ width: '100%', objectFit: 'cover', borderRadius: '10px' }} />
              </div>
            ) : (
              <div style={{ ...styles.noImagePlaceholder, marginBottom: '20px' }}>
                <Camera size={24} color="#334155" />
                <span>Sin evidencia fotográfica</span>
              </div>
            )}

            {/* Acciones */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {detailIncident.status === 0 && (
                <button 
                  onClick={() => { setDetailIncident(null); handleOpenResolveModal(detailIncident); }}
                  className="btn-primary" style={{ flex: 1 }}
                >
                  <CheckCircle size={16} />
                  <span>Resolver Incidente</span>
                </button>
              )}
              <button 
                onClick={() => setDetailIncident(null)} 
                className="btn-secondary" style={{ flex: detailIncident.status === 0 ? 0 : 1 }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX DE IMAGEN AMPLIADA */}
      {zoomImage && (
        <div style={styles.lightboxOverlay} onClick={() => setZoomImage(null)}>
          <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <img src={zoomImage} alt="Evidencia Ampliada" style={styles.lightboxImage} />
            <button onClick={() => setZoomImage(null)} style={styles.lightboxCloseBtn} title="Cerrar imagen ampliada" aria-label="Cerrar imagen ampliada">
              <X size={24} color="#ffffff" />
            </button>
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
  sosAlertBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sosHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  sosTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '0.5px',
  },
  sosSubtitle: {
    fontSize: '13.5px',
    color: '#f87171',
    fontWeight: '500',
    marginTop: '4px',
  },
  sosList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sosItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '14px 20px',
    borderRadius: '10px',
    gap: '20px',
  },
  sosItemText: {
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  sosResolveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
  },
  filterBar: {
    padding: '20px',
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
  filtersGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  filterItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
    padding: '0 12px',
    height: '42px',
  },
  select: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '13.5px',
    fontWeight: '600',
    outline: 'none',
    cursor: 'pointer',
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
  incidentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  },
  incidentCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(8, 12, 28, 0.5)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.5px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#cbd5e1',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  badgeJornada: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    color: '#a78bfa',
    border: '1px solid rgba(139, 92, 246, 0.15)',
  },
  badgeRonda: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.15)',
  },
  badgeMantencion: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    color: '#fb923c',
    border: '1px solid rgba(249, 115, 22, 0.15)',
  },
  severityBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.5px',
  },
  badgeHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.15)',
  },
  badgeMedium: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    color: '#eab308',
    border: '1px solid rgba(234, 179, 8, 0.15)',
  },
  badgeLow: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    color: '#3b82f6',
    border: '1px solid rgba(59, 130, 246, 0.15)',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    color: '#cbd5e1',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  statusBadgeResolved: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.15)',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  incidentTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#ffffff',
  },
  incidentDesc: {
    fontSize: '13px',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  incidentDate: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '500',
    marginTop: '4px',
  },
  imageContainer: {
    position: 'relative',
    height: '180px',
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    opacity: 0,
    transition: 'opacity var(--transition-fast)',
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff',
  },
  noImagePlaceholder: {
    height: '180px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    border: '1px dotted rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#475569',
    fontSize: '12px',
    fontWeight: '500',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '10px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast), border-color var(--transition-fast)',
  },
  resolvedInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12.5px',
    color: '#94a3b8',
    padding: '8px 4px',
    fontWeight: '500',
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
    maxWidth: '480px',
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
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  alertDetailBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '12px 16px',
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
    minHeight: '100px',
    resize: 'vertical',
  },
  modalActions: {
    display: 'flex',
    gap: '16px',
    marginTop: '10px',
  },
  lightboxOverlay: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
    padding: '20px',
  },
  lightboxContent: {
    position: 'relative',
    maxWidth: '90vw',
    maxHeight: '90vh',
  },
  lightboxImage: {
    maxWidth: '100%',
    maxHeight: '90vh',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: '-40px',
    right: 0,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  sosItemTitle: {
    fontSize: '14px',
  },
  sosItemDesc: {
    fontSize: '13px',
    opacity: 0.9,
  },
  sosItemTime: {
    fontSize: '11px',
    opacity: 0.7,
  },
  searchInputPremium: {
    paddingLeft: '44px',
  },
  modalTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '18px',
  },
  modalDesc: {
    color: '#cbd5e1',
    fontSize: '14px',
  },
  modalDetailTitle: {
    fontWeight: '700',
    color: '#ffffff',
    fontSize: '13.5px',
  },
  modalDetailDesc: {
    color: '#94a3b8',
    fontSize: '12.5px',
    marginTop: '4px',
  },
  modalActionBtn: {
    flex: 1,
  },
};

// Efecto de hover para la imagen
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = `
    .glass-card:hover img {
      transform: scale(1.02);
    }
    .glass-card img {
      transition: transform 0.3s ease;
    }
    .glass-card div:hover .image-overlay-hover {
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(styleSheet);
}
