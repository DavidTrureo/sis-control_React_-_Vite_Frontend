import { useEffect, useState, useMemo } from 'react';
import { Users, CheckCircle, Clock, ShieldAlert, Activity, Sparkles, Printer, Building2, TrendingUp, Lightbulb, Loader2, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, Legend, LineChart, Line } from 'recharts';
import { api } from '../services/api';
import logoImg from '../assets/logo.png';

// Tipos para los datos locales
interface DashboardStats {
  totalGuards: number;
  activeShiftsCount: number;
  totalRoundsToday: number;
  roundsInProgress: number;
  roundsCompleted: number;
  totalIncidents: number;
  pendingIncidents: number;
  totalInstallations: number;
  activeInstallationsCount: number;
  activeRoundsList: any[];
  activeShiftsList: any[];
}

interface HomeProps {
  onNavigate?: (tab: string) => void;
}

// Helper para parsear Markdown básico a HTML de forma robusta y elegante
function parseMarkdown(text: string): string {
  return text
    // 1. Títulos de nivel 3 (### Título)
    .replace(/^### (.*?)$/gm, '<h3 style="color: #a78bfa; margin-top: 18px; margin-bottom: 8px; font-size: 15px; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">$1</h3>')
    // 2. Títulos de nivel 2 (## Título)
    .replace(/^## (.*?)$/gm, '<h2 style="color: #f8fafc; margin-top: 22px; margin-bottom: 10px; font-size: 17px; font-weight: 800;">$1</h2>')
    // 3. Títulos de nivel 1 (# Título)
    .replace(/^# (.*?)$/gm, '<h1 style="color: #f8fafc; margin-top: 26px; margin-bottom: 12px; font-size: 20px; font-weight: 900;">$1</h1>')
    // 4. Viñetas de listas (* Elemento o - Elemento)
    .replace(/^\* (.*?)$/gm, '<span style="color: #a78bfa; margin-right: 6px;">•</span> $1')
    .replace(/^- (.*?)$/gm, '<span style="color: #a78bfa; margin-right: 6px;">•</span> $1')
    // 5. Negritas (**texto**)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // 6. Cursivas (*texto* o _texto_) sin confundir los asteriscos de viñetas ya reemplazadas
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // 7. Emojis de semáforo con estilo
    .replace(/🔴/g, '<span style="color:#ef4444;font-weight:bold">🔴</span>')
    .replace(/🟢/g, '<span style="color:#10b981;font-weight:bold">🟢</span>')
    // 8. Saltos de línea
    .replace(/\n/g, '<br/>');
}

// Convierte un path de imagen a Base64 en el navegador
const getBase64FromUrl = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Error converting web image to base64:', e);
    return url;
  }
};

// Helper para saber si un timestamp es de hoy
function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function Home({ onNavigate }: HomeProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalGuards: 0,
    activeShiftsCount: 0,
    totalRoundsToday: 0,
    roundsInProgress: 0,
    roundsCompleted: 0,
    totalIncidents: 0,
    pendingIncidents: 0,
    totalInstallations: 0,
    activeInstallationsCount: 0,
    activeRoundsList: [],
    activeShiftsList: [],
  });
  const [allIncidents, setAllIncidents] = useState<any[]>([]);
  const [allRounds, setAllRounds] = useState<any[]>([]);
  const [allShifts, setAllShifts] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiPredictions, setAiPredictions] = useState<string | null>(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  // Cargar estadísticas y eventos en tiempo real
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Dashboard Stats
        const resStats = await api.get('/api/reportes/dashboard-admin');
        setStats(resStats.data);

        // 2. Todos los incidentes
        try {
          const resInc = await api.get('/api/incidents');
          setAllIncidents(resInc.data || []);
        } catch (e) { console.warn('Error fetching incidents:', e); }

        // 3. Todas las rondas
        try {
          const resRounds = await api.get('/api/reportes/rondas/all');
          setAllRounds(resRounds.data || []);
        } catch (e) { console.warn('Error fetching rounds:', e); }

        // 4. Todas las jornadas
        try {
          const resShifts = await api.get('/api/reportes/jornadas/all');
          setAllShifts(resShifts.data || []);
        } catch (e) { console.warn('Error fetching shifts:', e); }
      } catch (err) {
        console.error('Error fetching dashboard general metrics:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Incidentes del día actual solamente
  const todayIncidents = useMemo(() => {
    return allIncidents.filter(inc => isToday(inc.clientTimestamp || inc.createdAt));
  }, [allIncidents]);

  // Gráfico REAL de incidentes por severidad (solo hoy)
  const chartDataSeverity = useMemo(() => {
    const alta = todayIncidents.filter(i => i.severity === 'ALTA').length;
    const media = todayIncidents.filter(i => i.severity === 'MEDIA').length;
    const baja = todayIncidents.filter(i => i.severity === 'BAJA').length;
    return [
      { name: 'Alta', Cantidad: alta, color: '#ef4444' },
      { name: 'Media', Cantidad: media, color: '#eab308' },
      { name: 'Baja', Cantidad: baja, color: '#3b82f6' },
    ];
  }, [todayIncidents]);

  // Gráfico REAL: Tendencia de incidentes últimos 7 días
  const chartDataTrend = useMemo(() => {
    const days: { name: string; Incidentes: number }[] = [];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const count = allIncidents.filter(inc => {
        const ts = inc.clientTimestamp || inc.createdAt;
        return ts && ts.startsWith(dayStr);
      }).length;
      days.push({ name: dayNames[d.getDay()], Incidentes: count });
    }
    return days;
  }, [allIncidents]);

  // Gráfico REAL: Cumplimiento de rondas (últimos 7 días)
  const chartDataWeekly = useMemo(() => {
    const days: { name: string; Completadas: number; Canceladas: number }[] = [];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      const dayRounds = allRounds.filter((r: any) => {
        const ts = r.startTime || r.createdAt;
        return ts && ts.startsWith(dayStr);
      });
      const completed = dayRounds.filter((r: any) => r.status === 'COMPLETED' || r.status === 'COMPLETADA').length;
      const cancelled = dayRounds.filter((r: any) => r.status === 'CANCELLED' || r.status === 'CANCELADA').length;
      days.push({ name: dayNames[d.getDay()], Completadas: completed, Canceladas: cancelled });
    }
    return days;
  }, [allRounds]);

  // Bitácora enriquecida: mezclar incidentes + jornadas + rondas del día
  useEffect(() => {
    const events: any[] = [];

    // Incidentes de hoy
    todayIncidents.forEach((inc: any) => {
      events.push({
        id: `inc-${inc.id}`,
        type: 'incident',
        title: inc.title,
        description: `${inc.description || ''} — Severidad: ${inc.severity}`,
        time: inc.clientTimestamp ? new Date(inc.clientTimestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '',
        rawTime: inc.clientTimestamp || inc.createdAt,
        status: inc.severity,
        badgeColor: inc.severity === 'ALTA' ? '#ef4444' : inc.severity === 'MEDIA' ? '#eab308' : '#3b82f6',
      });
    });

    // Jornadas de hoy
    allShifts.filter(s => isToday(s.entryTime || s.createdAt)).forEach((shift: any) => {
      events.push({
        id: `shift-${shift.id}`,
        type: 'shift',
        title: `Jornada iniciada — ${shift.guardName || 'Guardia'}`,
        description: `Instalación: ${shift.installationName || shift.location || 'N/A'}`,
        time: shift.entryTime ? new Date(shift.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '',
        rawTime: shift.entryTime || shift.createdAt,
        status: 'JORNADA',
        badgeColor: '#10b981',
      });
    });

    // Rondas de hoy
    allRounds.filter(r => isToday(r.startTime || r.createdAt)).forEach((round: any) => {
      events.push({
        id: `round-${round.id}`,
        type: 'round',
        title: `Ronda — ${round.guardName || 'Guardia'}`,
        description: `Estado: ${round.status || 'N/A'} — ${round.installationName || round.location || ''}`,
        time: round.startTime ? new Date(round.startTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : '',
        rawTime: round.startTime || round.createdAt,
        status: round.status === 'COMPLETED' || round.status === 'COMPLETADA' ? 'COMPLETADA' : round.status,
        badgeColor: round.status === 'COMPLETED' || round.status === 'COMPLETADA' ? '#10b981' : round.status === 'CANCELLED' || round.status === 'CANCELADA' ? '#ef4444' : '#3b82f6',
      });
    });

    const sorted = events
      .sort((a, b) => new Date(b.rawTime || 0).getTime() - new Date(a.rawTime || 0).getTime())
      .slice(0, 10);
    setRecentEvents(sorted);
  }, [todayIncidents, allShifts, allRounds]);

  const handleGenerateAIReport = async () => {
    setLoadingAi(true);
    setAiReport(null);
    try {
      const res = await api.get('/api/ia/resumen-dashboard');
      setAiReport(res.data.resumen);
    } catch (err: any) {
      console.error(err);
      
      // Generar reporte alternativo local usando las estadísticas en tiempo real
      const pct = stats.totalRoundsToday > 0 ? Math.round((stats.roundsCompleted / stats.totalRoundsToday) * 100) : 0;
      
      let estadoOperacion = "";
      if (stats.pendingIncidents > 0) {
        estadoOperacion = `La operación registra **${stats.pendingIncidents} incidente(s) crítico(s) pendiente(s)**. Se requiere la intervención y atención inmediata de la supervisión para coordinar acciones correctivas.`;
      } else if (stats.activeShiftsCount === 0) {
        estadoOperacion = "La operación está **Estable** sin personal de seguridad (guardias) activo registrado en el turno actual.";
      } else {
        estadoOperacion = `La operación se encuentra **Estable**. Contamos con **${stats.activeShiftsCount} guardias activos** cubriendo las instalaciones asignadas de forma regular.`;
      }

      let desempenoRondas = "";
      if (stats.totalRoundsToday === 0) {
        desempenoRondas = "No se registran rondas planificadas o ejecutadas para el turno de hoy.";
      } else {
        desempenoRondas = `Se han completado **${stats.roundsCompleted} de ${stats.totalRoundsToday} rondas** programadas (${pct}% de cumplimiento), con **${stats.roundsInProgress} ronda(s) actualmente en curso** en terreno.`;
      }

      let focoAtencion = "";
      if (stats.pendingIncidents > 0) {
        focoAtencion = `🔴 **EXIGE ATENCIÓN INMEDIATA:** Se registran incidentes activos sin resolver. El personal debe focalizarse en los puntos de conflicto y reportar novedades a la brevedad.`;
      } else {
        focoAtencion = `🟢 **SITUACIÓN BAJO CONTROL:** No se registran alertas críticas pendientes de revisión. El perímetro y las instalaciones activas se reportan resguardadas y sin novedades de riesgo.`;
      }

      const fallbackReport = `### 📊 **SITREP: Informe de Situación Operativa** (Generado Localmente)

⚠️ *Nota: Se generó este reporte de forma local debido a que el servicio de Inteligencia Artificial (Gemini) superó su cuota de uso o no se encuentra disponible temporalmente.*

* 🛡️ **Estado de la Operación:** ${estadoOperacion}

* 🔄 **Desempeño de Rondas:** ${desempenoRondas}

* ⚠️ **Foco de Atención:** ${focoAtencion}`;

      setAiReport(fallbackReport);
    } finally {
      setLoadingAi(false);
    }
  };

  const handlePrintAIReport = async () => {
    const rawUser = localStorage.getItem('user_data');
    let userName = 'Administrador';
    let userRole = 'ADMIN';
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        userName = u.fullName || u.username || userName;
        userRole = u.role || userRole;
      } catch (e) {}
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const formattedReport = aiReport ? parseMarkdown(aiReport) : '';
      let logoBase64 = logoImg;
      try {
        logoBase64 = await getBase64FromUrl(logoImg);
      } catch (err) {}

      printWindow.document.write(`
        <html>
          <head>
            <title>Informe de Situación Operativa — SIS Control</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');
              body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #1E293B; padding: 40px; line-height: 1.7; background-color: #FFFFFF; }
              .header-container { display: flex; flex-direction: column; align-items: center; border-bottom: 3px double #4F46E5; padding-bottom: 25px; margin-bottom: 35px; text-align: center; }
              .logo-img { height: 90px; max-width: 300px; object-fit: contain; margin-bottom: 15px; }
              .title { color: #1E1B4B; margin: 0; font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
              .subtitle { color: #64748B; font-size: 13px; margin-top: 8px; font-weight: 500; }
              .divider { width: 60px; height: 4px; background-color: #4F46E5; margin: 15px auto 0 auto; border-radius: 2px; }
              .kpi-container { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; justify-content: space-between; }
              .kpi-card { flex: 1 1 30%; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; box-sizing: border-box; min-width: 140px; }
              .kpi-card.alert { background-color: #FEF2F2; border-color: #FCA5A5; }
              .kpi-label { color: #64748B; font-size: 9px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; display: block; }
              .kpi-value { color: #1E3A8A; font-size: 12.5px; font-weight: 700; margin: 0; }
              .kpi-value.alert { color: #991B1B; }
              .content-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); font-size: 14.5px; color: #334155; }
              .content-box strong { color: #1E1B4B; font-weight: 700; }
              .footer { text-align: center; font-size: 10px; color: #94A3B8; margin-top: 60px; border-top: 1px solid #E2E8F0; padding-top: 20px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
              @media print { .no-print { display: none !important; } body { padding: 20px; } .content-box { border: none; background-color: transparent; padding: 0; box-shadow: none; } }
              .print-btn { background-color: #4F46E5; color: white; border: none; padding: 12px 28px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px; margin-bottom: 30px; display: block; width: fit-content; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); transition: all 0.2s; }
              .print-btn:hover { background-color: #4338CA; transform: translateY(-1px); }
            </style>
          </head>
          <body>
            <button class="no-print print-btn" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
            <div class="header-container">
              <img class="logo-img" src="${logoBase64}" alt="SIS Control" />
              <h1 class="title">SIS Control</h1>
              <div class="divider"></div>
              <p class="subtitle">INFORME DE SITUACIÓN OPERATIVA | ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})}</p>
            </div>

            <div class="kpi-container">
              <div class="kpi-card">
                <span class="kpi-label">Fecha y Hora</span>
                <p class="kpi-value">${new Date().toLocaleDateString('es-CL')} a las ${new Date().toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">Despliegue Personal</span>
                <p class="kpi-value">${stats.activeShiftsCount} de ${stats.totalGuards} en turno</p>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">Cobertura Instalaciones</span>
                <p class="kpi-value">${stats.activeInstallationsCount} de ${stats.totalInstallations} activas</p>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">Desempeño Rondas</span>
                <p class="kpi-value">${stats.roundsCompleted} de ${stats.totalRoundsToday} finalizadas (+${stats.roundsInProgress})</p>
              </div>
              <div class="kpi-card">
                <span class="kpi-label">Total Incidentes Hoy</span>
                <p class="kpi-value">${stats.totalIncidents} reportados</p>
              </div>
              <div class="kpi-card ${stats.pendingIncidents > 0 ? 'alert' : ''}">
                <span class="kpi-label">Alertas Críticas</span>
                <p class="kpi-value ${stats.pendingIncidents > 0 ? 'alert' : ''}">${stats.pendingIncidents} pendientes</p>
              </div>
            </div>

            <div style="font-size: 11px; color: #64748B; font-weight: 700; margin-bottom: 20px; text-transform: uppercase; border-bottom: 1px solid #E2E8F0; padding-bottom: 15px;">
              Generado por: ${userName} (${userRole})
            </div>

            <div class="content-box">
              ${formattedReport}
            </div>
            <div class="footer">
              Documento Confidencial y de Uso Exclusivo — SIS Control Sistemas de Seguridad
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    } else {
      alert('Por favor, permite las ventanas emergentes (pop-ups) para generar el PDF.');
    }
  };

  const handleKpiClick = (tab: string) => {
    if (onNavigate) onNavigate(tab);
  };

  return (
    <div style={styles.container}>
      {/* TARJETAS DE KPIs — CLICKEABLES */}
      <div style={styles.kpiGrid}>
        {/* Guardias activos */}
        <div className="glass-card" style={styles.kpiCard} onClick={() => handleKpiClick('users')} role="button" tabIndex={0}>
          <div style={styles.kpiHeader}>
            <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
              <Users size={22} color="#3b82f6" />
            </div>
            <span style={styles.kpiBadge}>EN TURNO</span>
          </div>
          <div style={styles.kpiValueWrapper}>
            <h3 style={styles.kpiValue}>{stats.activeShiftsCount}</h3>
            <span style={styles.kpiLabel}>de {stats.totalGuards} Guardias Registrados</span>
          </div>
        </div>

        {/* Alertas pendientes */}
        <div 
          className={`glass-card ${stats.pendingIncidents > 0 ? 'sos-pulse-border' : ''}`} 
          style={{ 
            ...styles.kpiCard, 
            ...(stats.pendingIncidents > 0 ? { border: '1px solid #ef4444' } : {}),
            cursor: 'pointer'
          }}
          onClick={() => handleKpiClick('incidents')}
          role="button" tabIndex={0}
        >
          <div style={styles.kpiHeader}>
            <div style={{ 
              ...styles.iconBadge, 
              backgroundColor: stats.pendingIncidents > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: stats.pendingIncidents > 0 ? '#ef4444' : 'rgba(255, 255, 255, 0.08)'
            }}>
              <ShieldAlert size={22} color={stats.pendingIncidents > 0 ? '#ef4444' : '#94a3b8'} />
            </div>
            <span style={{ 
              ...styles.kpiBadge, 
              color: stats.pendingIncidents > 0 ? '#ef4444' : '#94a3b8',
              backgroundColor: stats.pendingIncidents > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)'
            }}>
              {stats.pendingIncidents > 0 ? 'CRÍTICO' : 'ESTABLE'}
            </span>
          </div>
          <div style={styles.kpiValueWrapper}>
            <h3 style={{ ...styles.kpiValue, color: stats.pendingIncidents > 0 ? '#ef4444' : '#ffffff' }}>
              {stats.pendingIncidents}
            </h3>
            <span style={styles.kpiLabel}>Alertas pendientes ({todayIncidents.length} incidentes hoy)</span>
          </div>
        </div>

        {/* Rondas hoy */}
        <div className="glass-card" style={styles.kpiCard} onClick={() => handleKpiClick('monitor')} role="button" tabIndex={0}>
          <div style={styles.kpiHeader}>
            <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <CheckCircle size={22} color="#10b981" />
            </div>
            <span style={{ ...styles.kpiBadge, color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>RONDAS HOY</span>
          </div>
          <div style={styles.kpiValueWrapper}>
            <h3 style={styles.kpiValue}>{stats.totalRoundsToday}</h3>
            <span style={styles.kpiLabel}>{stats.roundsCompleted} completadas, {stats.roundsInProgress} en curso</span>
          </div>
        </div>

        {/* Instalaciones Activas */}
        <div className="glass-card" style={styles.kpiCard} onClick={() => handleKpiClick('installations')} role="button" tabIndex={0}>
          <div style={styles.kpiHeader}>
            <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(234, 179, 8, 0.15)', borderColor: 'rgba(234, 179, 8, 0.2)' }}>
              <Building2 size={22} color="#eab308" />
            </div>
            <span style={{ ...styles.kpiBadge, color: '#eab308', backgroundColor: 'rgba(234, 179, 8, 0.1)' }}>INSTALACIONES</span>
          </div>
          <div style={styles.kpiValueWrapper}>
            <h3 style={styles.kpiValue}>{stats.activeInstallationsCount}</h3>
            <span style={styles.kpiLabel}>de {stats.totalInstallations} Total Instalaciones</span>
          </div>
        </div>
      </div>

      {/* PANEL DE IA */}
      <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(0,0,0,0) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#c4b5fd', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} />
              Asistente de Seguridad IA
            </h4>
            <p style={styles.chartSubtitle}>Genera un informe ejecutivo del turno actual usando Inteligencia Artificial.</p>
          </div>
          <button 
            onClick={handleGenerateAIReport}
            disabled={loadingAi}
            style={{ 
              backgroundColor: '#8b5cf6', color: 'white', border: 'none', padding: '10px 20px', 
              borderRadius: '8px', fontWeight: '600', cursor: loadingAi ? 'not-allowed' : 'pointer',
              opacity: loadingAi ? 0.7 : 1, transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Sparkles size={16} />
            {loadingAi ? 'Analizando Turno...' : 'Generar Informe de Turno'}
          </button>
        </div>
        {aiReport && (
          (() => {
            const hasError = aiReport.toLowerCase().includes('error') || aiReport.toLowerCase().includes('falla');
            return (
              <div style={{ 
                marginTop: '16px', 
                padding: '20px', 
                backgroundColor: 'rgba(0,0,0,0.25)', 
                borderRadius: '8px', 
                borderLeft: hasError ? '4px solid #ef4444' : '4px solid #8b5cf6' 
              }}>
                <div 
                  style={{ color: '#f8fafc', fontSize: '14px', lineHeight: '1.7' }}
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(aiReport) }}
                />
                {!hasError && (
                  <button
                    onClick={handlePrintAIReport}
                    style={{
                      marginTop: '16px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: '0.2s'
                    }}
                  >
                    <Printer size={16} />
                    Imprimir / Guardar como PDF
                  </button>
                )}
              </div>
            );
          })()
        )}
      </div>

      {/* SECCIÓN DE GRÁFICOS */}
      <div style={styles.chartsGrid}>
        {/* Gráfico principal: Cumplimiento de rondas (últimos 7 días) — DATOS REALES */}
        <div className="glass-panel" style={styles.chartPanelLarge}>
          <div style={styles.chartHeader}>
            <div>
              <h4 style={styles.chartTitle}>Cumplimiento de Rondas — Últimos 7 Días</h4>
              <p style={styles.chartSubtitle}>Rondas completadas vs canceladas por día (datos reales)</p>
            </div>
            <Activity size={18} color="#94a3b8" />
          </div>
          <div style={styles.chartContent}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartDataWeekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompletadas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCanceladas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#ffffff' }} 
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area type="monotone" dataKey="Completadas" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompletadas)" />
                <Area type="monotone" dataKey="Canceladas" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorCanceladas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico secundario: Incidentes por gravedad HOY — DATOS REALES */}
        <div className="glass-panel" style={styles.chartPanelSmall}>
          <div style={styles.chartHeader}>
            <div>
              <h4 style={styles.chartTitle}>Incidentes Hoy por Gravedad</h4>
              <p style={styles.chartSubtitle}>Distribución del día actual ({todayIncidents.length} total)</p>
            </div>
          </div>
          <div style={styles.chartContent}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartDataSeverity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#ffffff' }} 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="Cantidad" radius={[4, 4, 0, 0]}>
                  {chartDataSeverity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* NUEVO: Tendencia de incidentes últimos 7 días */}
      <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={styles.chartHeader}>
          <div>
            <h4 style={styles.chartTitle}>Tendencia de Incidentes — Últimos 7 Días</h4>
            <p style={styles.chartSubtitle}>Evolución diaria de incidentes registrados en el sistema</p>
          </div>
          <TrendingUp size={18} color="#94a3b8" />
        </div>
        <div style={styles.chartContent}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartDataTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#ffffff' }} 
              />
              <Line type="monotone" dataKey="Incidentes" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PANEL DE PREDICCIONES IA */}
      <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(234, 179, 8, 0.2)', background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.04) 0%, rgba(0,0,0,0) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#fbbf24', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb size={20} />
              Análisis Predictivo y Sugerencias
            </h4>
            <p style={styles.chartSubtitle}>La IA analiza patrones operativos para detectar riesgos y oportunidades de mejora.</p>
          </div>
          <button 
            onClick={async () => {
              setLoadingPredictions(true);
              setAiPredictions(null);
              try {
                const res = await api.get('/api/ia/resumen-dashboard');
                setAiPredictions(res.data.resumen);
              } catch (err: any) {
                setAiPredictions('Error al generar predicciones: ' + (err.response?.data?.error || err.message));
              } finally {
                setLoadingPredictions(false);
              }
            }}
            disabled={loadingPredictions}
            style={{ 
              backgroundColor: '#d97706', color: 'white', border: 'none', padding: '10px 20px', 
              borderRadius: '8px', fontWeight: '600', cursor: loadingPredictions ? 'not-allowed' : 'pointer',
              opacity: loadingPredictions ? 0.7 : 1, transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            {loadingPredictions ? <Loader2 size={16} className="spin-animation" /> : <Lightbulb size={16} />}
            {loadingPredictions ? 'Analizando Patrones...' : 'Generar Análisis Predictivo'}
          </button>
        </div>

        {!aiPredictions && !loadingPredictions && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {/* Indicadores automáticos basados en datos reales */}
            <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <TrendingUp size={16} color="#10b981" />
                <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '700' }}>CUMPLIMIENTO</span>
              </div>
              <h4 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: 0 }}>
                {stats.totalRoundsToday > 0 ? Math.round((stats.roundsCompleted / stats.totalRoundsToday) * 100) : 0}%
              </h4>
              <span style={{ color: '#64748b', fontSize: '12px' }}>Rondas completadas hoy</span>
            </div>

            <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={16} color={todayIncidents.length > 5 ? '#ef4444' : '#eab308'} />
                <span style={{ color: todayIncidents.length > 5 ? '#ef4444' : '#eab308', fontSize: '12px', fontWeight: '700' }}>INCIDENCIA</span>
              </div>
              <h4 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: 0 }}>
                {todayIncidents.length}
              </h4>
              <span style={{ color: '#64748b', fontSize: '12px' }}>Incidentes del día actual</span>
            </div>

            <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Users size={16} color="#3b82f6" />
                <span style={{ color: '#3b82f6', fontSize: '12px', fontWeight: '700' }}>COBERTURA</span>
              </div>
              <h4 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: 0 }}>
                {stats.totalGuards > 0 ? Math.round((stats.activeShiftsCount / stats.totalGuards) * 100) : 0}%
              </h4>
              <span style={{ color: '#64748b', fontSize: '12px' }}>Guardias en servicio activo</span>
            </div>

            <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Building2 size={16} color="#a78bfa" />
                <span style={{ color: '#a78bfa', fontSize: '12px', fontWeight: '700' }}>INSTALACIONES</span>
              </div>
              <h4 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: 0 }}>
                {stats.activeInstallationsCount}/{stats.totalInstallations}
              </h4>
              <span style={{ color: '#64748b', fontSize: '12px' }}>Sedes activas operando</span>
            </div>
          </div>
        )}

        {loadingPredictions && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '12px' }}>
            <Loader2 size={24} className="spin-animation" color="#d97706" />
            <span style={{ color: '#fbbf24', fontWeight: '600' }}>Analizando patrones operativos con IA...</span>
          </div>
        )}

        {aiPredictions && (
          <div style={{ 
            marginTop: '16px', padding: '20px', backgroundColor: 'rgba(0,0,0,0.25)', 
            borderRadius: '8px', borderLeft: '4px solid #d97706' 
          }}>
            <div 
              style={{ color: '#f8fafc', fontSize: '14px', lineHeight: '1.7' }}
              dangerouslySetInnerHTML={{ __html: parseMarkdown(aiPredictions) }}
            />
          </div>
        )}
      </div>

      {/* BITÁCORA ENRIQUECIDA: Incidentes + Jornadas + Rondas del día */}
      <div className="glass-panel" style={styles.eventsPanel}>
        <div style={styles.chartHeader}>
          <div>
            <h4 style={styles.chartTitle}>Bitácora de Actividad en Vivo</h4>
            <p style={styles.chartSubtitle}>Jornadas, rondas e incidentes del día, sincronizados en tiempo real</p>
          </div>
          <Clock size={18} color="#94a3b8" />
        </div>

        <div style={styles.eventsList}>
          {recentEvents.length === 0 ? (
            <div style={styles.noEvents}>
              <p>Esperando actividad de guardias...</p>
            </div>
          ) : (
            recentEvents.map((event) => (
              <div 
                key={event.id} 
                style={{
                  ...styles.eventItem,
                  cursor: event.type === 'incident' ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (event.type === 'incident' && onNavigate) onNavigate('incidents');
                }}
              >
                <div style={{
                  ...styles.eventIndicator,
                  backgroundColor: event.badgeColor || '#3b82f6'
                }}></div>
                <div style={styles.eventTextWrapper}>
                  <div style={styles.eventRow}>
                    <span style={styles.eventTitle}>{event.title}</span>
                    <span style={styles.eventTime}>{event.time}</span>
                  </div>
                  <span style={styles.eventDesc}>{event.description}</span>
                </div>
                <div style={{
                  ...styles.eventStatusBadge,
                  backgroundColor: `${event.badgeColor}15`,
                  color: event.badgeColor,
                }}>
                  {event.type === 'incident' ? event.status : event.type === 'shift' ? 'JORNADA' : event.status}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '24px',
  },
  kpiCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  kpiHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiBadge: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: '4px 10px',
    borderRadius: '20px',
    letterSpacing: '0.5px',
  },
  kpiValueWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  kpiValue: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: '1',
  },
  kpiLabel: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
  },
  chartPanelLarge: {
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  chartPanelSmall: {
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  chartHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '4px',
  },
  chartSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500',
  },
  chartContent: {
    width: '100%',
  },
  eventsPanel: {
    padding: '24px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  eventsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  noEvents: {
    padding: '40px 0',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '14px',
  },
  eventItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '14px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '10px',
    transition: 'background-color 0.15s',
  },
  eventIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  eventTextWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
    minWidth: 0,
  },
  eventRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
  },
  eventTime: {
    fontSize: '12px',
    color: '#64748b',
    flexShrink: 0,
  },
  eventDesc: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  eventStatusBadge: {
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '6px',
    flexShrink: 0,
  },
};
