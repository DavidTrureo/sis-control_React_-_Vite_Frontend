import { useEffect, useState } from 'react';
import { api, downloadFile } from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
  ClipboardList, Search, Filter, RefreshCw, Clock, User, 
  Database, Activity, ToggleRight, Trash2, Key, Info, ShieldAlert, Download
} from 'lucide-react';

interface AuditLogEntry {
  id: number;
  userId: number | null;
  userName: string | null;
  action: string;
  entity: string;
  entityId: number | null;
  details: string;
  ipAddress: string | null;
  createdAt: string;
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const toast = useToast();


  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/audit-logs');
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      toast.info('Generando archivo de auditoría...');
      await downloadFile('/api/export/audit-logs/csv', `bitacora_auditoria_${new Date().toISOString().slice(0,10)}.csv`);
      toast.success('Bitácora descargada con éxito');
    } catch (err) {
      console.error('Error exportando logs:', err);
      toast.error('No se pudo descargar la bitácora');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return <Key size={16} color="#3b82f6" />;
      case 'CREATE':
        return <Database size={16} color="#10b981" />;
      case 'UPDATE':
        return <Activity size={16} color="#eab308" />;
      case 'DELETE':
        return <Trash2 size={16} color="#ef4444" />;
      case 'TOGGLE_STATUS':
        return <ToggleRight size={16} color="#a78bfa" />;
      case 'RESOLVE_INCIDENT':
        return <ShieldAlert size={16} color="#ec4899" />;
      default:
        return <Info size={16} color="#94a3b8" />;
    }
  };

  const getActionStyle = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return { backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
      case 'CREATE':
        return { backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
      case 'UPDATE':
        return { backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308' };
      case 'DELETE':
        return { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
      case 'TOGGLE_STATUS':
        return { backgroundColor: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa' };
      case 'RESOLVE_INCIDENT':
        return { backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' };
      default:
        return { backgroundColor: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8' };
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.userName || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.entity || '').toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'ALL' || log.entity === entityFilter;

    return matchesSearch && matchesAction && matchesEntity;
  });

  return (
    <div style={styles.container}>
      {/* BARRA DE FILTROS */}
      <div className="glass-panel" style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#64748b" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por usuario, acción, entidad o detalle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-premium"
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filtersGroup}>
          <div style={styles.filterItem}>
            <Filter size={16} color="#64748b" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={styles.select}
              title="Filtrar por Acción"
              aria-label="Filtrar por Acción"
            >
              <option value="ALL">Todas las Acciones</option>
              <option value="LOGIN">LOGIN (Inicios de Sesión)</option>
              <option value="CREATE">CREATE (Creaciones)</option>
              <option value="UPDATE">UPDATE (Actualizaciones)</option>
              <option value="DELETE">DELETE (Desactivaciones)</option>
              <option value="TOGGLE_STATUS">TOGGLE_STATUS (Cambios Estado)</option>
              <option value="RESOLVE_INCIDENT">RESOLVE_INCIDENT (Resolución SOS)</option>
              <option value="SEND_ANNOUNCEMENT">SEND_ANNOUNCEMENT (Anuncios)</option>
            </select>
          </div>

          <div style={styles.filterItem}>
            <Database size={16} color="#64748b" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              style={styles.select}
              title="Filtrar por Módulo/Entidad"
              aria-label="Filtrar por Módulo/Entidad"
            >
              <option value="ALL">Todos los Módulos</option>
              <option value="USER">Usuarios</option>
              <option value="INSTALLATION">Instalaciones</option>
              <option value="CHECKPOINT">Puntos NFC</option>
              <option value="INCIDENT">Incidentes / SOS</option>
            </select>
          </div>

          <button onClick={fetchLogs} className="btn-secondary" style={styles.refreshBtn} title="Recargar logs">
            <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
          </button>

          <button 
            onClick={handleExportCsv} 
            className="btn-primary" 
            disabled={exporting || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.7 : 1,
            }}
            title="Exportar Bitácora completa a Excel / CSV"
          >
            <Download size={15} />
            <span>{exporting ? 'Exportando...' : 'Exportar Excel'}</span>
          </button>
        </div>
      </div>

      {/* TABLA DE AUDITORÍA */}
      {loading ? (
        <div style={styles.loaderWrapper}>
          <RefreshCw size={36} className="spin-animation" color="#3b82f6" />
          <p style={{ marginTop: '12px', color: '#94a3b8' }}>Cargando logs de auditoría...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="glass-panel" style={styles.emptyState}>
          <ClipboardList size={48} color="#475569" />
          <h4 style={{ color: '#ffffff', marginTop: '16px', fontWeight: '700' }}>Sin registros de auditoría</h4>
          <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '6px' }}>
            No se encontraron eventos registrados que coincidan con la búsqueda.
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.th}>Fecha / Hora</th>
                <th style={styles.th}>Usuario Ejecutor</th>
                <th style={styles.th}>Acción</th>
                <th style={styles.th}>Módulo</th>
                <th style={styles.th}>Detalles del Log</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={styles.tableRow}>
                  <td style={styles.tdDate}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} color="#64748b" />
                      <span>{new Date(log.createdAt).toLocaleString('es-CL')}</span>
                    </div>
                  </td>
                  <td style={styles.tdUser}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={styles.avatar}>
                        <User size={14} color="#fff" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', color: '#fff' }}>{log.userName || 'Sistema'}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>ID: {log.userId || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '4px 10px', borderRadius: '6px', width: 'fit-content',
                      fontSize: '12px', fontWeight: '700',
                      ...getActionStyle(log.action)
                    }}>
                      {getActionIcon(log.action)}
                      <span>{log.action}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.entityBadge}>{log.entity}</span>
                  </td>
                  <td style={styles.tdDetails}>
                    <span style={{ color: '#e2e8f0' }}>{log.details}</span>
                    {log.entityId && (
                      <span style={styles.entityIdLabel}> (ID Ref: #{log.entityId})</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  filterBar: {
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
  searchInput: {
    paddingLeft: '44px',
  },
  filtersGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  filterItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '0 12px',
    height: '42px',
  },
  select: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '13.5px',
    fontWeight: '500',
    outline: 'none',
    cursor: 'pointer',
  },
  refreshBtn: {
    height: '42px',
    width: '42px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '16px 20px',
    fontSize: '13.5px',
    color: '#94a3b8',
  },
  tdDate: {
    padding: '16px 20px',
    fontSize: '13px',
    color: '#cbd5e1',
  },
  tdUser: {
    padding: '16px 20px',
    fontSize: '13.5px',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entityBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#cbd5e1',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  tdDetails: {
    padding: '16px 20px',
    fontSize: '13.5px',
  },
  entityIdLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500',
  },
};
