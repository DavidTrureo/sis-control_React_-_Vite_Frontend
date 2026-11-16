import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { api, TokenService } from '../services/api';
import { Shield, MapPin, Navigation, Clock, User, Building2, CheckCircle2, Loader2, BellRing } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fórmula Haversine para calcular distancia en metros entre el guardia y su instalación
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Formatear marca de tiempo de última señal GPS para auditoría de desconexión
function formatLastPing(isoString?: string | null): string {
  if (!isoString) return 'Sin registro de telemetría';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const dateStr = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const elapsedMinutes = Math.floor((Date.now() - d.getTime()) / 60000);
    const elapsedStr = elapsedMinutes > 60 
      ? `hace ${Math.floor(elapsedMinutes / 60)}h ${elapsedMinutes % 60}m`
      : `hace ${Math.max(1, elapsedMinutes)} min`;
    return `${dateStr} a las ${timeStr} hrs (${elapsedStr})`;
  } catch (e) {
    return isoString;
  }
}

// Componente para re-centrar el mapa únicamente cuando hay una solicitud explícita (carga inicial o clic del usuario)
function ChangeView({ center, zoom, trigger }: { center: [number, number]; zoom: number; trigger: number }) {
  const map = useMap();
  useEffect(() => {
    if (trigger > 0) {
      map.flyTo(center, zoom, { duration: 0.6 });
    }
  }, [trigger]);
  return null;
}

// ==========================================================================
// CONFIGURACIÓN DE ICONOS PERSONALIZADOS CON CSS (EVITA IMÁGENES ROTAS DE LEAFLET)
// ==========================================================================

// 1. Icono para Instalaciones fijas (Azul/Gris Tecnológico)
const createInstallationIcon = (name: string) => L.divIcon({
  className: 'custom-leaflet-icon',
  html: `
    <div style="
      position: relative;
      width: 32px;
      height: 32px;
      background-color: #0f172a;
      border: 2px solid #3b82f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
        <path d="M6 18h12"/>
        <path d="M6 14h12"/>
        <path d="M6 10h12"/>
        <path d="M6 6h12"/>
      </svg>
      <div style="
        position: absolute;
        bottom: -22px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #ffffff;
        font-family: inherit;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
        pointer-events: none;
      ">${name}</div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// 2. Icono para Guardia en Servicio Normal (Verde Activo con Pulso sutil)
const createGuardIcon = (name: string, isFocused = false) => L.divIcon({
  className: 'custom-leaflet-icon',
  html: `
    <div style="
      position: relative;
      width: ${isFocused ? '40px' : '34px'};
      height: ${isFocused ? '40px' : '34px'};
      background-color: #0f172a;
      border: ${isFocused ? '3px solid #ffffff' : '2.5px solid #10b981'};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: ${isFocused ? '0 0 22px rgba(16, 185, 129, 0.95), 0 0 0 3px #10b981' : '0 0 12px rgba(16, 185, 129, 0.5)'};
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6Z"/>
      </svg>
      <!-- Pulso de animación verde -->
      <div style="
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: rgba(16, 185, 129, 0.2);
        animation: pulse-green 1.8s infinite;
        z-index: -1;
      "></div>
      <div style="
        position: absolute;
        bottom: -24px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${isFocused ? '#059669' : 'rgba(16, 185, 129, 0.95)'};
        border: ${isFocused ? '1.5px solid #ffffff' : 'none'};
        color: #ffffff;
        font-family: inherit;
        font-size: ${isFocused ? '11px' : '10px'};
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 4px;
        white-space: nowrap;
        pointer-events: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
      ">${name}</div>
    </div>
  `,
  iconSize: isFocused ? [40, 40] : [34, 34],
  iconAnchor: isFocused ? [20, 20] : [17, 17],
  popupAnchor: [0, -20],
});

// 4. Icono para Guardia con Jornada Iniciada en Espera (Naranja/Ámbar con Pulso lento)
const createIdleGuardIcon = (name: string, isFocused = false) => L.divIcon({
  className: 'custom-leaflet-icon',
  html: `
    <div style="
      position: relative;
      width: ${isFocused ? '40px' : '34px'};
      height: ${isFocused ? '40px' : '34px'};
      background-color: #0f172a;
      border: ${isFocused ? '3px solid #ffffff' : '2.5px solid #d97706'};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: ${isFocused ? '0 0 22px rgba(217, 119, 6, 0.95), 0 0 0 3px #d97706' : '0 0 12px rgba(217, 119, 6, 0.5)'};
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <!-- Pulso de animación naranja -->
      <div style="
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: rgba(217, 119, 6, 0.2);
        animation: pulse-orange 2.2s infinite;
        z-index: -1;
      "></div>
      <div style="
        position: absolute;
        bottom: -24px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${isFocused ? '#b45309' : 'rgba(217, 119, 6, 0.95)'};
        border: ${isFocused ? '1.5px solid #ffffff' : 'none'};
        color: #ffffff;
        font-family: inherit;
        font-size: ${isFocused ? '11px' : '10px'};
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 4px;
        white-space: nowrap;
        pointer-events: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
      ">${name}</div>
    </div>
  `,
  iconSize: isFocused ? [40, 40] : [34, 34],
  iconAnchor: isFocused ? [20, 20] : [17, 17],
  popupAnchor: [0, -20],
});

// 3. Icono para Alerta de Pánico SOS (Rojo con Pulso de Emergencia Grande)
const createSosIcon = (name: string, isFocused = false) => L.divIcon({
  className: 'custom-leaflet-icon',
  html: `
    <div style="
      position: relative;
      width: ${isFocused ? '42px' : '38px'};
      height: ${isFocused ? '42px' : '38px'};
      background-color: #7f1d1d;
      border: ${isFocused ? '3px solid #ffffff' : '3px solid #ef4444'};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.8);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <!-- Pulso SOS de onda expansiva -->
      <div style="
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: rgba(239, 68, 68, 0.4);
        animation: pulse-sos 1.4s infinite;
        z-index: -1;
      "></div>
      <div style="
        position: absolute;
        bottom: -24px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #ef4444;
        border: ${isFocused ? '1.5px solid #ffffff' : 'none'};
        color: #ffffff;
        font-family: inherit;
        font-size: 10.5px;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
        pointer-events: none;
        box-shadow: 0 2px 6px rgba(0,0,0,0.5);
      ">⚠️ SOS: ${name}</div>
    </div>
  `,
  iconSize: isFocused ? [42, 42] : [38, 38],
  iconAnchor: isFocused ? [21, 21] : [19, 19],
  popupAnchor: [0, -21],
});

// 5. Icono para Guardia Desconectado (Gris/Rojo con indicador de pérdida de señal)
const createDisconnectedGuardIcon = (name: string, isFocused = false) => L.divIcon({
  className: 'custom-leaflet-icon',
  html: `
    <div style="
      position: relative;
      width: ${isFocused ? '40px' : '34px'};
      height: ${isFocused ? '40px' : '34px'};
      background-color: #1e293b;
      border: ${isFocused ? '3px solid #ffffff' : '2.5px solid #ef4444'};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: ${isFocused ? '0 0 20px rgba(239, 68, 68, 0.8)' : '0 0 10px rgba(239, 68, 68, 0.4)'};
      opacity: 0.95;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="1" y1="1" x2="23" y2="23"/>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
        <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
        <line x1="12" y1="20" x2="12.01" y2="20"/>
      </svg>
      <div style="
        position: absolute;
        bottom: -24px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #dc2626;
        border: ${isFocused ? '1.5px solid #ffffff' : 'none'};
        color: #ffffff;
        font-family: inherit;
        font-size: ${isFocused ? '11px' : '10px'};
        font-weight: 800;
        padding: 2px 7px;
        border-radius: 4px;
        white-space: nowrap;
        pointer-events: none;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
      ">🔴 ${name} (Desconectado)</div>
    </div>
  `,
  iconSize: isFocused ? [40, 40] : [34, 34],
  iconAnchor: isFocused ? [20, 20] : [17, 17],
  popupAnchor: [0, -20],
});

export default function RealTimeMonitor() {
  const [activeRounds, setActiveRounds] = useState<any[]>([]);
  const [activeShifts, setActiveShifts] = useState<any[]>([]);
  const [installations, setInstallations] = useState<any[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-33.4489, -70.6693]); // Santiago por defecto
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [focusTrigger, setFocusTrigger] = useState<number>(0);
  const [focusedGuardName, setFocusedGuardName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pingSentGuards, setPingSentGuards] = useState<Record<string, boolean>>({});
  const isInitialLoadRef = useRef(true);
  const lastPulseRef = useRef<number>(0);
  const markerRefs = useRef<Record<string, any>>({});
  const prevPresenceStatusRef = useRef<Record<string, string>>({});
  const toast = useToast();

  const currentUser = TokenService.getUser();
  const currentUserId = currentUser?.userId || 1;
  const fetchRealTimeData = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }
    try {
      const pulseRes = await api.get('/api/reportes/pulse');
      if (pulseRes.data?.version) {
        lastPulseRef.current = pulseRes.data.version;
      }
    } catch (e) {}
    let instList: any[] = [];
    
    // 1. Cargar instalaciones fijas con su propio try-catch
    try {
      const resInst = await api.get('/api/instalaciones');
      instList = Array.isArray(resInst.data) ? resInst.data : [];
      setInstallations(instList);
    } catch (err) {
      console.error('Error fetching installations on monitor:', err);
    }

    // 2. Cargar jornadas activas (activeShiftsList)
    let shiftsList: any[] = [];
    try {
      const userRole = currentUser?.role;
      const endpoint = userRole === 'ADMIN' 
        ? '/api/reportes/dashboard-admin' 
        : `/api/reportes/dashboard-supervisor/${currentUserId}`;
      const resStats = await api.get(endpoint);
      shiftsList = Array.isArray(resStats.data?.activeShiftsList) ? resStats.data.activeShiftsList : [];
      shiftsList.forEach((s: any) => {
        if (!s?.guardName) return;
        const prevStatus = prevPresenceStatusRef.current[s.guardName];
        const currStatus = s.presenceStatus || 'IDLE';
        if (prevStatus === 'PENDING' && currStatus === 'CONFIRMED') {
          toast.success(`✅ ${s.guardName} confirmó su presencia en puesto (${s.presenceUpdatedAt || 'ahora'})`);
          setPingSentGuards(prev => ({ ...prev, [s.guardName]: false }));
        } else if (prevStatus === 'PENDING' && currStatus === 'EXPIRED') {
          toast.error(`🚨 ${s.guardName} NO respondió al Control de Presencia en los 60 segundos`);
          setPingSentGuards(prev => ({ ...prev, [s.guardName]: false }));
        }
        prevPresenceStatusRef.current[s.guardName] = currStatus;
      });
      setActiveShifts(shiftsList);
    } catch (err) {
      console.error('Error fetching shifts list:', err);
    }

    // 3. Cargar rondas activas con su propio try-catch
    let detailedRounds: any[] = [];
    try {
      const resRondas = await api.get('/api/rondas/buscar');
      const roundItems = Array.isArray(resRondas.data) ? resRondas.data : [];
      const activeSummaryList = roundItems.filter((r: any) => r.endTime === 'En progreso');

      const detailedRoundsPromises = activeSummaryList.map(async (summary: any) => {
        try {
          const detailRes = await api.get(`/api/rondas/${summary.id}?requesterId=${currentUserId}`);
          const detailData = detailRes.data;
          
          if (detailData && detailData.ronda) {
            const rondaObj = detailData.ronda;
            const checklogsList = detailData.escaneos || [];
            
            const guardNameStr = rondaObj.worker?.fullName || 'Guardia de Seguridad';
            const matchingShift = shiftsList.find(s => s.guardName === guardNameStr);

            // Determinar la coordenada geolocalizada reportada (priorizando GPS en vivo del turno o último checklog)
            let lat = Number(rondaObj.installation?.latitude) || -33.4489;
            let lng = Number(rondaObj.installation?.longitude) || -70.6693;
            
            if (checklogsList.length > 0) {
              const lastLog = checklogsList[checklogsList.length - 1];
              if (lastLog.latitude && lastLog.longitude) {
                lat = Number(lastLog.latitude);
                lng = Number(lastLog.longitude);
              }
            }
            if (matchingShift?.latitude && matchingShift?.longitude) {
              lat = Number(matchingShift.latitude);
              lng = Number(matchingShift.longitude);
            }

            const instLat = Number(rondaObj.installation?.latitude);
            const instLng = Number(rondaObj.installation?.longitude);
            const allowedRadius = Number(rondaObj.installation?.radiusInMeters) || 100;
            const distanceMeters = (instLat && instLng) ? getDistanceInMeters(lat, lng, instLat, instLng) : 0;
            const outsidePerimeter = distanceMeters > allowedRadius;

            const hasSos = detailData.incidentes?.some((i: any) => 
              i.status === 0 && 
              (i.title.toUpperCase().includes('PÁNICO') || i.title.toUpperCase().includes('SOS'))
            ) || false;

            const totalCp = summary.checkpointsTotal ?? summary.totalCheckpoints ?? 0;
            const execCp = summary.checkpointsExecuted ?? 0;

            return {
              id: rondaObj.id,
              guardName: guardNameStr,
              installationName: rondaObj.installation?.name || 'Sede Operativa',
              escaneados: execCp,
              totalCheckpoints: totalCp,
              percent: totalCp > 0 ? Math.round((execCp / totalCp) * 100) : 0,
              latitude: lat,
              longitude: lng,
              startTime: summary.startTime ? summary.startTime.substring(0, 5) : '00:00',
              hasSos,
              outsidePerimeter,
              distanceMeters,
              allowedRadius,
              presenceStatus: matchingShift?.presenceStatus || 'IDLE',
              presenceRemainingSeconds: matchingShift?.presenceRemainingSeconds || 0,
              presenceUpdatedAt: matchingShift?.presenceUpdatedAt || null,
              lastLocationUpdate: summary.lastLocationUpdate || matchingShift?.lastLocationUpdate || null,
              isOnline: summary.isOnline ?? matchingShift?.isOnline ?? true,
              secondsSinceLastPing: summary.secondsSinceLastPing ?? matchingShift?.secondsSinceLastPing ?? 0
            };
          }
          return null;
        } catch (e) {
          return null;
        }
      });

      const results = await Promise.all(detailedRoundsPromises);
      detailedRounds = results.filter(r => r !== null);
      setActiveRounds(detailedRounds);
      
      if (isInitialLoadRef.current && detailedRounds.length > 0) {
        setMapCenter([detailedRounds[0].latitude, detailedRounds[0].longitude]);
        setMapZoom(15);
        setFocusTrigger(prev => prev + 1);
        isInitialLoadRef.current = false;
      } else if (isInitialLoadRef.current && shiftsList.length > 0) {
        const validShift = shiftsList.find(s => s.latitude && s.longitude);
        if (validShift) {
          setMapCenter([Number(validShift.latitude), Number(validShift.longitude)]);
          setMapZoom(15);
          setFocusTrigger(prev => prev + 1);
          isInitialLoadRef.current = false;
        }
      }
    } catch (err) {
      console.error('Error fetching rounds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeData(true);

    const checkPulseAndSync = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const res = await api.get('/api/reportes/pulse');
        const remoteVersion = res.data?.version;
        if (remoteVersion && remoteVersion !== lastPulseRef.current) {
          lastPulseRef.current = remoteVersion;
          await fetchRealTimeData(false);
        }
      } catch (e) {
        // Fallback silencioso
      }
    };

    const interval = setInterval(checkPulseAndSync, 3500);
    const handleVisibilityChange = () => {
      if (!document.hidden) checkPulseAndSync();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Calcular posiciones ligeramente separadas (spider offset) cuando varios guardias están en la misma coordenada/instalación
  const guardPositions = (() => {
    const posMap: Record<string, [number, number]> = {};
    const validShifts = (Array.isArray(activeShifts) ? activeShifts : []).filter(
      shift => shift && shift.latitude !== null && shift.latitude !== undefined && shift.longitude !== null && shift.longitude !== undefined
    );

    const rawCoords = validShifts.map((shift) => {
      const currentRound = activeRounds.find(r => r.guardName === shift.guardName);
      const lat = currentRound ? Number(currentRound.latitude) : Number(shift.latitude);
      const lng = currentRound ? Number(currentRound.longitude) : Number(shift.longitude);
      return { guardName: shift.guardName, shiftId: shift.id, lat, lng };
    }).filter(item => !isNaN(item.lat) && !isNaN(item.lng) && item.lat !== 0 && item.lng !== 0);

    // Agrupar por cercanía (~10 metros = 0.0001 grados)
    const groups: { centerLat: number; centerLng: number; items: typeof rawCoords }[] = [];
    rawCoords.forEach((item) => {
      const existingGroup = groups.find(
        g => Math.abs(g.centerLat - item.lat) < 0.00012 && Math.abs(g.centerLng - item.lng) < 0.00012
      );
      if (existingGroup) {
        existingGroup.items.push(item);
      } else {
        groups.push({ centerLat: item.lat, centerLng: item.lng, items: [item] });
      }
    });

    groups.forEach((group) => {
      if (group.items.length === 1) {
        const only = group.items[0];
        // Desplazar levemente hacia arriba-derecha si coincide exactamente con el icono de la instalación
        posMap[only.guardName] = [only.lat + 0.00008, only.lng + 0.00008];
      } else {
        const radius = 0.00018; // ~18 metros de separación visual
        group.items.forEach((item, idx) => {
          const angle = (2 * Math.PI * idx) / group.items.length;
          posMap[item.guardName] = [
            group.centerLat + radius * Math.sin(angle),
            group.centerLng + radius * Math.cos(angle),
          ];
        });
      }
    });

    return posMap;
  })();

  const handleCenterMarker = (lat: number, lng: number, guardName?: string) => {
    let targetLat = lat;
    let targetLng = lng;
    if (guardName) {
      setFocusedGuardName(guardName);
      if (guardPositions[guardName]) {
        targetLat = guardPositions[guardName][0];
        targetLng = guardPositions[guardName][1];
      }
      setTimeout(() => {
        const marker = markerRefs.current[guardName];
        if (marker && typeof marker.openPopup === 'function') {
          marker.openPopup();
        }
      }, 300);
    }
    setMapCenter([targetLat, targetLng]);
    setMapZoom(17);
    setFocusTrigger(prev => prev + 1);
  };

  const handleRequestPresenceCheck = async (guardName: string, shiftId?: number) => {
    if (pingSentGuards[guardName]) return;
    try {
      setPingSentGuards(prev => ({ ...prev, [guardName]: true }));
      prevPresenceStatusRef.current[guardName] = 'PENDING';
      await api.post('/api/rondas/presencia/solicitar', {
        shiftId: shiftId || null,
        guardName,
        adminId: currentUserId,
      });
      toast.info(`🔔 Solicitud enviada a ${guardName}. Esperando confirmación (60s)...`);
      await fetchRealTimeData(false);
      setTimeout(() => {
        setPingSentGuards(prev => ({ ...prev, [guardName]: false }));
      }, 62000);
    } catch (err) {
      console.error('Error solicitando control de presencia:', err);
      setPingSentGuards(prev => ({ ...prev, [guardName]: false }));
      toast.error('No se pudo enviar la solicitud de verificación.');
    }
  };

  return (
    <div style={styles.container}>
      {/* VISTA MAPA DE LEAFLET */}
      <div className="glass-panel" style={styles.mapCard}>
        <div className="dark-map" style={styles.mapWrapper}>
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            scrollWheelZoom={true}
          >
            <ChangeView center={mapCenter} zoom={mapZoom} trigger={focusTrigger} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* A. Renderizar TODAS las Instalaciones fijas de la base de datos */}
            {(Array.isArray(installations) ? installations : [])
              .filter(inst => inst && inst.latitude !== null && inst.latitude !== undefined && inst.longitude !== null && inst.longitude !== undefined)
              .map((inst) => (
                <Marker 
                  key={`inst-${inst.id}`} 
                  position={[Number(inst.latitude), Number(inst.longitude)]}
                  icon={createInstallationIcon(inst.name)}
                  zIndexOffset={100}
                >
                  <Popup>
                    <div style={styles.popup}>
                      <div style={styles.popupHeader}>
                        <Building2 size={16} color="#3b82f6" />
                        <strong style={styles.popupInstTitle}>Instalación SIS-Control</strong>
                      </div>
                      <p style={styles.popupName}>{inst.name}</p>
                      <p style={styles.popupAddress}>📍 {inst.address || 'Sin dirección registrada'}</p>
                      <p style={styles.popupClient}>Cliente: {inst.clientName || 'SIS-Control'}</p>
                      <p style={styles.popupRadius}>
                        Radio de Tolerancia: {inst.radiusInMeters || 100}m
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))
            }
            {/* B. Renderizar Guardias en Jornada (Activos en Ronda o En Espera) */}
            {(Array.isArray(activeShifts) ? activeShifts : [])
              .filter(shift => shift && shift.latitude !== null && shift.latitude !== undefined && shift.longitude !== null && shift.longitude !== undefined)
              .map((shift) => {
                const currentRound = activeRounds.find(r => r.guardName === shift.guardName);
                const rawLat = currentRound ? Number(currentRound.latitude) : Number(shift.latitude);
                const rawLng = currentRound ? Number(currentRound.longitude) : Number(shift.longitude);

                if (isNaN(rawLat) || isNaN(rawLng) || rawLat === 0 || rawLng === 0) return null;

                const assignedInst = (Array.isArray(installations) ? installations : []).find(
                  inst => inst.name === (currentRound?.installationName || shift.location)
                );
                const instRadius = Number(assignedInst?.radiusInMeters) || 100;
                const distFromInst = (assignedInst?.latitude && assignedInst?.longitude)
                  ? getDistanceInMeters(rawLat, rawLng, Number(assignedInst.latitude), Number(assignedInst.longitude))
                  : (currentRound?.distanceMeters || 0);
                const isOutsidePerimeter = currentRound?.outsidePerimeter || (distFromInst > instRadius);

                const [lat, lng] = guardPositions[shift.guardName] || [rawLat, rawLng];
                const isFocused = focusedGuardName === shift.guardName;

                return (
                  <Marker 
                    key={`guard-${shift.id}`} 
                    ref={(el) => { if (el) markerRefs.current[shift.guardName] = el; }}
                    position={[lat, lng]}
                    zIndexOffset={isFocused ? 3000 : (currentRound ? 1000 : 500)}
                    eventHandlers={{
                      click: () => setFocusedGuardName(shift.guardName),
                    }}
                    icon={
                      currentRound?.hasSos
                        ? createSosIcon(shift.guardName, isFocused)
                        : (!currentRound?.isOnline && !shift?.isOnline)
                          ? createDisconnectedGuardIcon(shift.guardName, isFocused)
                          : currentRound
                            ? createGuardIcon(shift.guardName, isFocused)
                            : createIdleGuardIcon(shift.guardName, isFocused)
                    }
                  >
                    <Popup>
                      <div style={styles.popup}>
                        {currentRound ? (
                          <>
                            <div style={styles.popupHeader}>
                              <Shield size={16} color={currentRound.hasSos ? '#ef4444' : '#10b981'} />
                              <strong style={currentRound.hasSos ? styles.popupGuardTitleSos : styles.popupGuardTitle}>
                                {currentRound.hasSos ? '⚠️ PÁNICO SOS ACTIVO' : '👮 Guardia Patrullando'}
                              </strong>
                            </div>
                            <p style={styles.popupName}>{shift.guardName}</p>
                            <p style={styles.popupSede}>Sede: {currentRound.installationName}</p>
                            <p style={styles.popupStartTime}>Hora de Inicio: {currentRound.startTime} hrs</p>
                            {isOutsidePerimeter && (
                              <div style={{ marginTop: '6px', padding: '4px 8px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', fontSize: '11px', fontWeight: 700 }}>
                                ⚠️ Fuera de Perímetro ({distFromInst}m / máx. {instRadius}m)
                              </div>
                            )}
                            
                            <div style={styles.popupProgress}>
                              <span style={styles.popupRondaText}>Ronda: {currentRound.escaneados}/{currentRound.totalCheckpoints} Escaneados</span>
                              <div style={styles.popupProgressBar}>
                                <div style={{ ...styles.popupProgressFill, width: `${currentRound.percent}%`, backgroundColor: currentRound.hasSos ? '#ef4444' : '#10b981' }}></div>
                              </div>
                            </div>

                            {/* Estado de Conexión y Última Señal GPS */}
                            {(!currentRound.isOnline || !shift.isOnline) ? (
                              <div style={{ marginTop: '8px', padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.16)', border: '1px solid rgba(239, 68, 68, 0.45)', color: '#fca5a5', fontSize: '11px', lineHeight: '1.4' }}>
                                <div style={{ fontWeight: 800 }}>🔴 DESCONECTADO (Sin señal GPS)</div>
                                <div style={{ fontSize: '10.5px', color: '#cbd5e1', marginTop: '2px' }}>
                                  Última conexión: {formatLastPing(currentRound.lastLocationUpdate || shift.lastLocationUpdate)}
                                </div>
                                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                                  App posiblemente cerrada o sin conexión de datos.
                                </div>
                              </div>
                            ) : (
                              <div style={{ marginTop: '6px', fontSize: '11px', color: '#34d399', fontWeight: 600 }}>
                                🟢 GPS En Vivo (hace {currentRound.secondsSinceLastPing || shift.secondsSinceLastPing || 0}s)
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div style={styles.popupHeader}>
                              <User size={16} color="#d97706" />
                              <strong style={{ ...styles.popupGuardTitle, color: '#f59e0b' }}>
                                👤 Jornada Iniciada (En Espera)
                              </strong>
                            </div>
                            <p style={styles.popupName}>{shift.guardName}</p>
                            <p style={styles.popupSede}>Instalación: {shift.location || 'Sede Principal'}</p>
                            <p style={styles.popupStartTime}>Hora de Entrada: {shift.entryTime ? shift.entryTime.substring(11, 16) : '--:--'} hrs</p>
                            {isOutsidePerimeter && (
                              <div style={{ marginTop: '6px', padding: '4px 8px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', fontSize: '11px', fontWeight: 700 }}>
                                ⚠️ Fuera de Perímetro ({distFromInst}m / máx. {instRadius}m)
                              </div>
                            )}

                            {/* Estado de Conexión y Última Señal GPS para Guardia en Espera */}
                            {(!shift.isOnline) ? (
                              <div style={{ marginTop: '8px', padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.16)', border: '1px solid rgba(239, 68, 68, 0.45)', color: '#fca5a5', fontSize: '11px', lineHeight: '1.4' }}>
                                <div style={{ fontWeight: 800 }}>🔴 DESCONECTADO (Sin señal GPS)</div>
                                <div style={{ fontSize: '10.5px', color: '#cbd5e1', marginTop: '2px' }}>
                                  Última conexión: {formatLastPing(shift.lastLocationUpdate)}
                                </div>
                                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                                  App posiblemente cerrada o sin conexión de datos.
                                </div>
                              </div>
                            ) : (
                              <div style={{ marginTop: '6px', fontSize: '11px', color: '#34d399', fontWeight: 600 }}>
                                🟢 GPS En Vivo (hace {shift.secondsSinceLastPing || 0}s)
                              </div>
                            )}

                            <div style={{ ...styles.popupProgress, color: '#94a3b8', fontSize: '11.5px', marginTop: '6px' }}>
                              <span>El guardia inició su turno y está disponible. Aún no ha iniciado una ronda de patrullaje.</span>
                            </div>
                          </>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
          </MapContainer>

          {/* MAP LEGEND OVERLAY (Premium design) */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '12px 16px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
          }}>
            <strong style={{ color: '#fff', fontSize: '11px', fontWeight: '700', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Leyenda del Mapa</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0f172a', border: '2px solid #3b82f6' }}></div>
              <span>Instalación Fija</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0f172a', border: '2.5px solid #10b981' }}></div>
              <span>En Ronda (Patrullando)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0f172a', border: '2.5px solid #d97706' }}></div>
              <span>Jornada Iniciada (En Espera)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#1e293b', border: '2.5px solid #ef4444' }}></div>
              <span>🔴 Desconectado (Sin señal GPS)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#7f1d1d', border: '3px solid #ef4444' }}></div>
              <span>Emergencia SOS Pánico</span>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL LATERAL DE RONDAS Y GUARDIA EN CURSO */}
      <div className="glass-panel" style={styles.sidebarPanel}>
        <div style={styles.panelHeader}>
          <Shield size={18} color="#3b82f6" />
          <h4 style={styles.panelTitle}>Guardias Activos ({activeShifts.length})</h4>
        </div>

        <div style={{ ...styles.roundsList, overflowY: 'auto' }}>
          {loading ? (
            <div style={styles.listLoader}>
              <Loader2 size={24} className="spin-animation" color="#3b82f6" />
              <span style={styles.syncText}>Sincronizando GPS...</span>
            </div>
          ) : activeShifts.length === 0 ? (
            <div style={styles.noActiveRounds}>
              <CheckCircle2 size={32} color="#64748b" />
              <p style={styles.noActiveTitle}>Sin Actividad</p>
              <p style={styles.noActiveDesc}>
                No hay guardias en servicio ni rondas iniciadas. Las sedes fijas se muestran en el mapa.
              </p>
            </div>
          ) : (
            <>
              {/* Sección A: En Patrullaje */}
              {activeRounds.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🔴 Patrullando ({activeRounds.length})
                  </span>
                  {activeRounds.map((round) => (
                    <div 
                      key={`list-round-${round.id}`} 
                      style={round.hasSos || round.outsidePerimeter ? styles.roundCardSosActive : styles.roundCard}
                    >
                      <div style={styles.cardTopRow}>
                        <div style={styles.guardLabel}>
                          <User size={15} color="#94a3b8" />
                          <span style={styles.guardName}>{round.guardName}</span>
                        </div>
                        <div style={styles.timeBadge}>
                          <Clock size={11} color="#64748b" />
                          <span style={styles.timeText}>{round.startTime} hrs</span>
                        </div>
                      </div>

                      <div style={styles.instLabel}>
                        <MapPin size={13} color="#3b82f6" />
                        <span style={styles.instName}>{round.installationName}</span>
                      </div>

                      {/* Estado de Conexión y Última Señal GPS */}
                      {(!round.isOnline) ? (
                        <div style={{ padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.16)', border: '1px solid rgba(239, 68, 68, 0.45)', color: '#fca5a5', fontSize: '11px', lineHeight: '1.3' }}>
                          <div style={{ fontWeight: 800 }}>🔴 DESCONECTADO (Sin señal GPS)</div>
                          <div style={{ fontSize: '10.5px', color: '#cbd5e1', marginTop: '2px' }}>
                            Última conexión: {formatLastPing(round.lastLocationUpdate)}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>🟢 GPS En Vivo (hace {round.secondsSinceLastPing || 0}s)</span>
                        </div>
                      )}

                      {round.outsidePerimeter && (
                        <div style={{ padding: '5px 8px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.14)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', fontSize: '11.5px', fontWeight: 700 }}>
                          ⚠️ Fuera de Perímetro ({round.distanceMeters}m / máx. {round.allowedRadius}m)
                        </div>
                      )}

                      <div style={styles.progressBox}>
                        <div style={styles.progressHeader}>
                          <span style={styles.progressTitle}>Progreso de Puntos</span>
                          <span style={styles.progressCount}>{round.escaneados}/{round.totalCheckpoints}</span>
                        </div>
                        <div style={styles.progressBarBg}>
                          <div style={{
                            ...styles.progressBarFill,
                            width: `${round.percent}%`,
                            backgroundColor: round.hasSos ? '#ef4444' : '#10b981'
                          }}></div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleCenterMarker(round.latitude, round.longitude, round.guardName)}
                          style={{ ...(round.hasSos ? styles.centerBtnActiveSos : styles.centerBtn), flex: 1 }}
                        >
                          <Navigation size={13} />
                          <span>Centrar</span>
                        </button>
                        <button
                          onClick={() => handleRequestPresenceCheck(round.guardName)}
                          disabled={!!pingSentGuards[round.guardName] || round.presenceStatus === 'PENDING'}
                          style={{
                            ...styles.centerBtn,
                            flex: 1,
                            color: (pingSentGuards[round.guardName] || round.presenceStatus === 'PENDING')
                              ? '#94a3b8'
                              : round.presenceStatus === 'CONFIRMED'
                                ? '#34d399'
                                : round.presenceStatus === 'EXPIRED'
                                  ? '#f87171'
                                  : '#f59e0b',
                            borderColor: (pingSentGuards[round.guardName] || round.presenceStatus === 'PENDING')
                              ? 'rgba(255,255,255,0.06)'
                              : round.presenceStatus === 'CONFIRMED'
                                ? 'rgba(16, 185, 129, 0.4)'
                                : round.presenceStatus === 'EXPIRED'
                                  ? 'rgba(239, 68, 68, 0.4)'
                                  : 'rgba(245, 158, 11, 0.35)',
                            backgroundColor: (pingSentGuards[round.guardName] || round.presenceStatus === 'PENDING')
                              ? 'rgba(255,255,255,0.02)'
                              : round.presenceStatus === 'CONFIRMED'
                                ? 'rgba(16, 185, 129, 0.12)'
                                : round.presenceStatus === 'EXPIRED'
                                  ? 'rgba(239, 68, 68, 0.12)'
                                  : 'rgba(245, 158, 11, 0.08)',
                          }}
                          title="Solicita al guardia confirmar en 60s que tiene el teléfono en mano"
                        >
                          <BellRing size={13} />
                          <span>
                            {(pingSentGuards[round.guardName] || round.presenceStatus === 'PENDING')
                              ? `⏳ Esperando (${round.presenceRemainingSeconds || 60}s)...`
                              : round.presenceStatus === 'CONFIRMED'
                                ? `✅ Confirmado (${round.presenceUpdatedAt?.substring(0, 5) || 'OK'})`
                                : round.presenceStatus === 'EXPIRED'
                                  ? `🚨 Sin Respuesta`
                                  : 'Verificar Presencia'}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sección B: En Espera */}
              {(Array.isArray(activeShifts) ? activeShifts : []).filter(s => !(Array.isArray(activeRounds) ? activeRounds : []).some(r => r.guardName === s.guardName)).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: (Array.isArray(activeRounds) ? activeRounds : []).length > 0 ? '16px' : '0' }}>
                  <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🟡 En Espera / Disponible ({(Array.isArray(activeShifts) ? activeShifts : []).filter(s => !(Array.isArray(activeRounds) ? activeRounds : []).some(r => r.guardName === s.guardName)).length})
                  </span>
                  {(Array.isArray(activeShifts) ? activeShifts : [])
                    .filter(s => !(Array.isArray(activeRounds) ? activeRounds : []).some(r => r.guardName === s.guardName))
                    .map((shift) => {
                      const assignedInst = (Array.isArray(installations) ? installations : []).find(
                        inst => inst.name === shift.location
                      );
                      const instRadius = Number(assignedInst?.radiusInMeters) || 100;
                      const distFromInst = (assignedInst?.latitude && assignedInst?.longitude && shift.latitude && shift.longitude)
                        ? getDistanceInMeters(Number(shift.latitude), Number(shift.longitude), Number(assignedInst.latitude), Number(assignedInst.longitude))
                        : 0;
                      const shiftOutside = distFromInst > instRadius;

                      return (
                        <div 
                          key={`list-shift-${shift.id}`} 
                          style={{ ...styles.roundCard, borderLeft: shiftOutside ? '3px solid #ef4444' : '3px solid #d97706' }}
                        >
                          <div style={styles.cardTopRow}>
                            <div style={styles.guardLabel}>
                              <User size={15} color="#94a3b8" />
                              <span style={styles.guardName}>{shift.guardName}</span>
                            </div>
                            <div style={styles.timeBadge}>
                              <Clock size={11} color="#64748b" />
                              <span style={styles.timeText}>{shift.entryTime ? shift.entryTime.substring(11, 16) : '--:--'} hrs</span>
                            </div>
                          </div>

                          <div style={styles.instLabel}>
                            <MapPin size={13} color="#3b82f6" />
                            <span style={styles.instName}>{shift.location || 'Sede Principal'}</span>
                          </div>

                          {/* Estado de Conexión y Última Señal GPS */}
                          {(!shift.isOnline) ? (
                            <div style={{ padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.16)', border: '1px solid rgba(239, 68, 68, 0.45)', color: '#fca5a5', fontSize: '11px', lineHeight: '1.3' }}>
                              <div style={{ fontWeight: 800 }}>🔴 DESCONECTADO (Sin señal GPS)</div>
                              <div style={{ fontSize: '10.5px', color: '#cbd5e1', marginTop: '2px' }}>
                                Última conexión: {formatLastPing(shift.lastLocationUpdate)}
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>🟢 GPS En Vivo (hace {shift.secondsSinceLastPing || 0}s)</span>
                            </div>
                          )}

                          {shiftOutside && (
                            <div style={{ padding: '5px 8px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.14)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', fontSize: '11.5px', fontWeight: 700 }}>
                              ⚠️ Fuera de Perímetro ({distFromInst}m / máx. {instRadius}m)
                            </div>
                          )}

                          <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                            Guardia con jornada iniciada. Disponible y a la espera de patrullar.
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            {(shift.latitude && shift.longitude && Number(shift.latitude) !== 0) && (
                              <button 
                                onClick={() => handleCenterMarker(Number(shift.latitude), Number(shift.longitude), shift.guardName)}
                                style={{ ...styles.centerBtn, flex: 1 }}
                              >
                                <Navigation size={13} />
                                <span>Centrar</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleRequestPresenceCheck(shift.guardName, shift.id)}
                              disabled={!!pingSentGuards[shift.guardName] || shift.presenceStatus === 'PENDING'}
                              style={{
                                ...styles.centerBtn,
                                flex: 1,
                                color: (pingSentGuards[shift.guardName] || shift.presenceStatus === 'PENDING')
                                  ? '#94a3b8'
                                  : shift.presenceStatus === 'CONFIRMED'
                                    ? '#34d399'
                                    : shift.presenceStatus === 'EXPIRED'
                                      ? '#f87171'
                                      : '#f59e0b',
                                borderColor: (pingSentGuards[shift.guardName] || shift.presenceStatus === 'PENDING')
                                  ? 'rgba(255,255,255,0.06)'
                                  : shift.presenceStatus === 'CONFIRMED'
                                    ? 'rgba(16, 185, 129, 0.4)'
                                    : shift.presenceStatus === 'EXPIRED'
                                      ? 'rgba(239, 68, 68, 0.4)'
                                      : 'rgba(245, 158, 11, 0.35)',
                                backgroundColor: (pingSentGuards[shift.guardName] || shift.presenceStatus === 'PENDING')
                                  ? 'rgba(255,255,255,0.02)'
                                  : shift.presenceStatus === 'CONFIRMED'
                                    ? 'rgba(16, 185, 129, 0.12)'
                                    : shift.presenceStatus === 'EXPIRED'
                                      ? 'rgba(239, 68, 68, 0.12)'
                                      : 'rgba(245, 158, 11, 0.08)',
                              }}
                              title="Solicita al guardia confirmar en 60s que tiene el teléfono en mano"
                            >
                              <BellRing size={13} />
                              <span>
                                {(pingSentGuards[shift.guardName] || shift.presenceStatus === 'PENDING')
                                  ? `⏳ Esperando (${shift.presenceRemainingSeconds || 60}s)...`
                                  : shift.presenceStatus === 'CONFIRMED'
                                    ? `✅ Confirmado (${shift.presenceUpdatedAt?.substring(0, 5) || 'OK'})`
                                    : shift.presenceStatus === 'EXPIRED'
                                      ? `🚨 Sin Respuesta`
                                      : 'Verificar Presencia'}
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* INSERCIÓN DINÁMICA DE ESTILOS CSS PARA ANIMACIÓN DE PULSOS GPS */}
      {typeof document !== 'undefined' && !document.getElementById('gps-pulse-styles') && (
        <style id="gps-pulse-styles">{`
          @keyframes pulse-green {
            0% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.6); opacity: 0; }
          }
          @keyframes pulse-orange {
            0% { transform: scale(1); opacity: 0.7; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          @keyframes pulse-sos {
            0% { transform: scale(1); opacity: 0.9; }
            50% { transform: scale(1.8); opacity: 0.4; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          .custom-leaflet-icon {
            background: none !important;
            border: none !important;
          }
        `}</style>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'grid',
    gridTemplateColumns: '2.5fr 1fr',
    gap: '24px',
    height: 'calc(100vh - 140px)',
  },
  mapCard: {
    padding: '8px',
    height: '100%',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  sidebarPanel: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    height: '100%',
    overflowY: 'auto',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '14px',
  },
  panelTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#ffffff',
  },
  roundsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flex: 1,
  },
  listLoader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
  },
  noActiveRounds: {
    padding: '30px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    border: '1px dotted rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
  },
  roundCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'border-color var(--transition-fast)',
  },
  roundCardSos: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.02)',
    boxShadow: '0 0 10px rgba(239, 68, 68, 0.1)',
  },
  cardTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guardLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  guardName: {
    fontSize: '13.5px',
    fontWeight: '600',
    color: '#ffffff',
  },
  timeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  timeText: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500',
  },
  instLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  instName: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  progressBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  progressHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  progressTitle: {
    color: '#64748b',
  },
  progressCount: {
    fontWeight: '600',
    color: '#ffffff',
  },
  progressBarBg: {
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.4s ease',
  },
  centerBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: '100%',
    padding: '8px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#3b82f6',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
  },
  centerBtnSos: {
    color: '#ef4444',
  },
  popup: {
    fontFamily: 'inherit',
    minWidth: '160px',
  },
  popupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '4px',
    marginBottom: '4px',
  },
  popupProgress: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '8px',
  },
  popupProgressBar: {
    height: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  popupProgressFill: {
    height: '100%',
    borderRadius: '2px',
  },
  mapWrapper: {
    height: '100%',
    width: '100%',
    position: 'relative',
  },
  popupInstTitle: {
    color: '#3b82f6',
    fontSize: '13.5px',
  },
  popupName: {
    fontWeight: '700',
    fontSize: '13px',
    margin: '4px 0 2px 0',
    color: '#ffffff',
  },
  popupAddress: {
    color: '#94a3b8',
    fontSize: '12px',
    margin: '2px 0',
  },
  popupClient: {
    color: '#64748b',
    fontSize: '11px',
    margin: '2px 0',
  },
  popupRadius: {
    color: '#10b981',
    fontSize: '11.5px',
    fontWeight: '600',
    marginTop: '6px',
  },
  popupGuardTitle: {
    color: '#10b981',
    fontSize: '13.5px',
  },
  popupGuardTitleSos: {
    color: '#ef4444',
    fontSize: '13.5px',
  },
  popupSede: {
    color: '#94a3b8',
    fontSize: '12px',
  },
  popupStartTime: {
    color: '#64748b',
    fontSize: '11px',
    marginTop: '4px',
  },
  popupRondaText: {
    fontSize: '11px',
    color: '#cbd5e1',
  },
  syncText: {
    marginTop: '8px',
    fontSize: '13px',
    color: '#64748b',
  },
  noActiveTitle: {
    fontWeight: '600',
    color: '#ffffff',
    marginTop: '12px',
  },
  noActiveDesc: {
    fontSize: '12px',
    color: '#64748b',
    textAlign: 'center',
    marginTop: '4px',
  },
  roundCardSosActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.02)',
    border: '1px solid #ef4444',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'border-color var(--transition-fast)',
    boxShadow: '0 0 10px rgba(239, 68, 68, 0.1)',
  },
  centerBtnActiveSos: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: '100%',
    padding: '8px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#ef4444',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
  },
};
