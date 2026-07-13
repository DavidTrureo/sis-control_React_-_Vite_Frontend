import React, { useEffect, useState } from 'react';
import { api, TokenService } from '../services/api';
import { 
  Building2, Plus, Edit, Loader2, MapPin, 
  Layers, ShieldCheck, X, Info, 
  Radio, Camera, ShieldAlert, ToggleLeft, ToggleRight
} from 'lucide-react';

interface Installation {
  id: number;
  name: string;
  address: string;
  clientName: string | null;
  location: string | null;
  status: number;
  latitude: number;
  longitude: number;
  radiusInMeters: number;
}

interface Checkpoint {
  id: number;
  name: string;
  executionOrder: number;
  nfcTagCode: string;
  locationDescription: string | null;
  instruction: string | null;
  status: number;
  requiresPhoto: boolean;
  referenceImageUrl: string | null;
}

export default function InstallationsManagement() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [selectedInst, setSelectedInst] = useState<Installation | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  
  // Loaders
  const [loadingInst, setLoadingInst] = useState(true);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [checkActionLoadingId, setCheckActionLoadingId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Modales
  const [showInstModal, setShowInstModal] = useState(false);
  const [instModalMode, setInstModalMode] = useState<'create' | 'edit'>('create');
  const [editingInstId, setEditingInstId] = useState<number | null>(null);

  const [showCheckModal, setShowCheckModal] = useState(false);
  const [checkModalMode, setCheckModalMode] = useState<'create' | 'edit'>('create');
  const [editingCheckId, setEditingCheckId] = useState<number | null>(null);

  // Formulario Instalaciones
  const [instName, setInstName] = useState('');
  const [instAddress, setInstAddress] = useState('');
  const [instClientName, setInstClientName] = useState('');
  const [instLocation, setInstLocation] = useState('');
  const [instLat, setInstLat] = useState('-33.4489');
  const [instLng, setInstLng] = useState('-70.6693');
  const [instRadius, setInstRadius] = useState('100');
  const [instStatus, setInstStatus] = useState(1);
  const [instError, setInstError] = useState('');

  // Estados para autocompletado de dirección
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedAddress, setDebouncedAddress] = useState('');
  const ignoreNextGeocode = React.useRef(false);

  // Efecto de Debounce para búsqueda de dirección (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedAddress(instAddress);
    }, 300);
    return () => clearTimeout(handler);
  }, [instAddress]);

  // Consulta de Geocoding a nuestro Backend Proxy (Google Maps) para evitar problemas de CORS en navegador
  useEffect(() => {
    if (ignoreNextGeocode.current) {
      ignoreNextGeocode.current = false;
      return;
    }

    if (debouncedAddress.trim().length < 4) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const response = await api.get(`/api/instalaciones/geocode?address=${encodeURIComponent(debouncedAddress)}`);
        
        // El endpoint devuelve el JSON de Google Maps, el cual puede venir parseado o como string
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        
        if (data.status === 'OK' && data.results) {
          setSuggestions(data.results);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error("Geocoding Proxy Error:", error);
      }
    };

    fetchSuggestions();
  }, [debouncedAddress]);

  const handleSelectSuggestion = (suggestion: any) => {
    ignoreNextGeocode.current = true;
    setInstAddress(suggestion.formatted_address);
    setInstLat(suggestion.geometry.location.lat.toString());
    setInstLng(suggestion.geometry.location.lng.toString());
    
    // Intentar extraer la comuna de address_components
    const communeComponent = suggestion.address_components.find((comp: any) => 
      comp.types.includes("administrative_area_level_3") || 
      comp.types.includes("locality") || 
      comp.types.includes("sublocality")
    );
    if (communeComponent) {
      setInstLocation(communeComponent.long_name);
    }
    
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const captureGPSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setInstLat(position.coords.latitude.toString());
          setInstLng(position.coords.longitude.toString());
          alert("Coordenadas GPS capturadas con éxito.");
        },
        (error) => {
          console.error("Error capturing GPS location: ", error);
          alert("No se pudo obtener la ubicación. Por favor, concede permisos de GPS al navegador.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("La geolocalización no está soportada en este navegador.");
    }
  };

  // Formulario Checkpoints
  const [checkName, setCheckName] = useState('');
  const [checkOrder, setCheckOrder] = useState('1');
  const [checkNfcCode, setCheckNfcCode] = useState('');
  const [checkLocDesc, setCheckLocDesc] = useState('');
  const [checkInstruction, setCheckInstruction] = useState('');
  const [checkRequiresPhoto, setCheckRequiresPhoto] = useState(false);
  const [checkStatus, setCheckStatus] = useState(1);
  const [checkError, setCheckError] = useState('');

  const currentUser = TokenService.getUser();
  const editorId = currentUser?.userId || currentUser?.id || 1;

  // Cargar todas las instalaciones
  const fetchInstallations = async () => {
    try {
      setLoadingInst(true);
      const res = await api.get('/api/instalaciones');
      setInstallations(res.data || []);
      
      // Auto-seleccionar la primera si hay y no hay ninguna seleccionada
      if (res.data && res.data.length > 0 && !selectedInst) {
        setSelectedInst(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching installations:', err);
    } finally {
      setLoadingInst(false);
    }
  };

  // Cargar checkpoints de la instalación seleccionada
  const fetchCheckpoints = async (instId: number) => {
    try {
      setLoadingCheck(true);
      const res = await api.get(`/api/instalaciones/${instId}/checkpoints`);
      setCheckpoints(res.data || []);
    } catch (err) {
      console.error('Error fetching checkpoints:', err);
    } finally {
      setLoadingCheck(false);
    }
  };

  useEffect(() => {
    fetchInstallations();
  }, []);

  useEffect(() => {
    if (selectedInst) {
      fetchCheckpoints(selectedInst.id);
    } else {
      setCheckpoints([]);
    }
  }, [selectedInst]);

  // Alternar estado instalación
  const handleToggleInstStatus = async (e: React.MouseEvent, inst: Installation) => {
    e.stopPropagation();
    try {
      setActionLoadingId(inst.id);
      await api.patch(`/api/instalaciones/${inst.id}/toggle-status?editorId=${editorId}`);
      await fetchInstallations();
      
      // Actualizar seleccionada si corresponde
      if (selectedInst && selectedInst.id === inst.id) {
        setSelectedInst(prev => prev ? { ...prev, status: prev.status === 1 ? 0 : 1 } : null);
      }
    } catch (err) {
      console.error('Error toggling installation status:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Abrir modal crear instalación
  const handleOpenCreateInst = () => {
    setInstModalMode('create');
    setInstName('');
    setInstAddress('');
    setInstClientName('');
    setInstLocation('');
    setInstLat('-33.4489');
    setInstLng('-70.6693');
    setInstRadius('100');
    setInstStatus(1);
    setInstError('');
    setShowInstModal(true);
  };

  // Abrir modal editar instalación
  const handleOpenEditInst = (e: React.MouseEvent, inst: Installation) => {
    e.stopPropagation();
    setInstModalMode('edit');
    setEditingInstId(inst.id);
    setInstName(inst.name || '');
    setInstAddress(inst.address || '');
    setInstClientName(inst.clientName || '');
    setInstLocation(inst.location || '');
    setInstLat(inst.latitude?.toString() || '-33.4489');
    setInstLng(inst.longitude?.toString() || '-70.6693');
    setInstRadius(inst.radiusInMeters?.toString() || '100');
    setInstStatus(inst.status);
    setInstError('');
    setShowInstModal(true);
  };

  // Guardar instalación
  const handleSaveInst = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName.trim() || !instAddress.trim()) {
      setInstError('Nombre y dirección son obligatorios.');
      return;
    }

    try {
      setFormLoading(true);
      setInstError('');
      const body = {
        name: instName,
        address: instAddress,
        clientName: instClientName || null,
        location: instLocation || null,
        latitude: Number(instLat) || -33.4489,
        longitude: Number(instLng) || -70.6693,
        radiusInMeters: Number(instRadius) || 100,
        status: instStatus
      };

      if (instModalMode === 'create') {
        await api.post(`/api/instalaciones?editorId=${editorId}`, body);
      } else {
        await api.put(`/api/instalaciones/${editingInstId}?editorId=${editorId}`, body);
      }

      setShowInstModal(false);
      await fetchInstallations();
    } catch (err: any) {
      console.error('Error saving installation:', err);
      setInstError('Error al guardar. Verifica la conexión con el servidor.');
    } finally {
      setFormLoading(false);
    }
  };

  // Alternar estado checkpoint
  const handleToggleCheckStatus = async (checkpoint: Checkpoint) => {
    try {
      setCheckActionLoadingId(checkpoint.id);
      await api.patch(`/api/instalaciones/checkpoints/${checkpoint.id}/toggle-status?editorId=${editorId}`);
      if (selectedInst) {
        await fetchCheckpoints(selectedInst.id);
      }
    } catch (err) {
      console.error('Error toggling checkpoint status:', err);
    } finally {
      setCheckActionLoadingId(null);
    }
  };

  // Abrir modal crear checkpoint
  const handleOpenCreateCheck = () => {
    if (!selectedInst) return;
    setCheckModalMode('create');
    setCheckName('');
    setCheckOrder((checkpoints.length + 1).toString());
    setCheckNfcCode('');
    setCheckLocDesc('');
    setCheckInstruction('');
    setCheckRequiresPhoto(false);
    setCheckStatus(1);
    setCheckError('');
    setShowCheckModal(true);
  };

  // Abrir modal editar checkpoint
  const handleOpenEditCheck = (checkpoint: Checkpoint) => {
    setCheckModalMode('edit');
    setEditingCheckId(checkpoint.id);
    setCheckName(checkpoint.name || '');
    setCheckOrder(checkpoint.executionOrder?.toString() || '1');
    setCheckNfcCode(checkpoint.nfcTagCode || '');
    setCheckLocDesc(checkpoint.locationDescription || '');
    setCheckInstruction(checkpoint.instruction || '');
    setCheckRequiresPhoto(checkpoint.requiresPhoto || false);
    setCheckStatus(checkpoint.status);
    setCheckError('');
    setShowCheckModal(true);
  };

  // Guardar checkpoint
  const handleSaveCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInst) return;
    if (!checkName.trim() || !checkNfcCode.trim()) {
      setCheckError('El nombre y el código NFC son obligatorios.');
      return;
    }

    try {
      setFormLoading(true);
      setCheckError('');
      
      const body = {
        name: checkName,
        executionOrder: Number(checkOrder) || 1,
        nfcTagCode: checkNfcCode,
        locationDescription: checkLocDesc || null,
        instruction: checkInstruction || null,
        status: checkStatus,
        requiresPhoto: checkRequiresPhoto,
        installation: {
          id: selectedInst.id
        }
      };

      if (checkModalMode === 'create') {
        await api.post(`/api/instalaciones/checkpoints?editorId=${editorId}`, body);
      } else {
        await api.put(`/api/instalaciones/checkpoints/${editingCheckId}?editorId=${editorId}`, body);
      }

      setShowCheckModal(false);
      await fetchCheckpoints(selectedInst.id);
    } catch (err: any) {
      console.error('Error saving checkpoint:', err);
      setCheckError('Error al guardar. Asegúrate que el código NFC no esté duplicado.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      
      {/* COLUMNA IZQUIERDA: LISTADO DE INSTALACIONES */}
      <div className="glass-panel" style={styles.leftCol}>
        <div style={styles.headerRow}>
          <div style={styles.titleWrapper}>
            <Building2 size={20} color="#3b82f6" />
            <h3 style={styles.sectionTitle}>Sedes e Instalaciones ({installations.length})</h3>
          </div>
          <button onClick={handleOpenCreateInst} className="btn-primary" style={styles.addBtn} title="Agregar nueva instalación" aria-label="Agregar nueva instalación">
            <Plus size={16} />
            <span>Nueva Sede</span>
          </button>
        </div>

        {loadingInst ? (
          <div style={styles.loaderContainer}>
            <Loader2 size={36} className="spin-animation" color="#3b82f6" />
            <p style={styles.loaderText}>Cargando sedes fijas...</p>
          </div>
        ) : installations.length === 0 ? (
          <div style={styles.emptyState}>
            <Building2 size={40} color="#475569" />
            <p style={styles.emptyText}>No hay instalaciones registradas.</p>
          </div>
        ) : (
          <div style={styles.scrollList}>
            {installations.map((inst) => {
              const isSelected = selectedInst?.id === inst.id;
              return (
                <div 
                  key={inst.id}
                  onClick={() => setSelectedInst(inst)}
                  className="glass-card"
                  style={isSelected ? styles.cardActive : styles.card}
                >
                  <div style={styles.cardHeader}>
                    <div style={styles.cardTitleInfo}>
                      <strong style={styles.instName}>{inst.name}</strong>
                      <span style={styles.clientName}>{inst.clientName || 'Cliente General'}</span>
                    </div>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: inst.status === 1 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: inst.status === 1 ? '#10b981' : '#f87171'
                    }}>
                      {inst.status === 1 ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <p style={styles.addressText}>📍 {inst.address}</p>

                  <div style={styles.geoRow}>
                    <div style={styles.geoItem}>
                      <Radio size={12} color="#64748b" />
                      <span>Geocerca: {inst.radiusInMeters || 100}m</span>
                    </div>
                    <div style={styles.geoItem}>
                      <MapPin size={12} color="#64748b" />
                      <span>{inst.latitude?.toFixed(4)}, {inst.longitude?.toFixed(4)}</span>
                    </div>
                  </div>

                  <div style={styles.cardActions}>
                    <button 
                      onClick={(e) => handleOpenEditInst(e, inst)}
                      style={styles.actionBtn}
                      title="Editar sede"
                      aria-label="Editar sede"
                    >
                      <Edit size={14} />
                      <span>Editar</span>
                    </button>
                    <button 
                      onClick={(e) => handleToggleInstStatus(e, inst)}
                      style={styles.toggleBtn}
                      disabled={actionLoadingId === inst.id}
                      title={inst.status === 1 ? 'Desactivar sede' : 'Activar sede'}
                      aria-label={inst.status === 1 ? 'Desactivar sede' : 'Activar sede'}
                    >
                      {actionLoadingId === inst.id ? (
                        <Loader2 size={18} className="spin-animation" color="#3b82f6" />
                      ) : inst.status === 1 ? (
                        <ToggleRight size={28} color="#10b981" />
                      ) : (
                        <ToggleLeft size={28} color="#ef4444" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COLUMNA DERECHA: CHECKPOINTS DE LA INSTALACIÓN SELECCIONADA */}
      <div className="glass-panel" style={styles.rightCol}>
        {selectedInst ? (
          <>
            <div style={styles.headerRow}>
              <div style={styles.titleWrapper}>
                <Layers size={20} color="#10b981" />
                <div>
                  <h3 style={styles.sectionTitle}>Puntos NFC (Checkpoints)</h3>
                  <span style={styles.subSubtitle}>Asociados a: {selectedInst.name}</span>
                </div>
              </div>
              <button 
                onClick={handleOpenCreateCheck} 
                className="btn-primary" 
                style={styles.addBtnCheck}
                title="Agregar nuevo checkpoint NFC"
                aria-label="Agregar nuevo checkpoint NFC"
              >
                <Plus size={16} />
                <span>Agregar Punto</span>
              </button>
            </div>

            {loadingCheck ? (
              <div style={styles.loaderContainer}>
                <Loader2 size={36} className="spin-animation" color="#10b981" />
                <p style={styles.loaderText}>Consultando puntos NFC...</p>
              </div>
            ) : checkpoints.length === 0 ? (
              <div style={styles.emptyState}>
                <ShieldCheck size={40} color="#475569" />
                <p style={styles.emptyText}>No hay checkpoints registrados en esta instalación.</p>
                <p style={styles.emptySub}>Crea un punto NFC para que los guardias puedan escanearlo en sus rondas.</p>
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Orden</th>
                      <th style={styles.th}>Nombre del Punto</th>
                      <th style={styles.th}>Tag NFC Code</th>
                      <th style={styles.th}>Ubicación Física</th>
                      <th style={styles.th}>Instrucción Operativa</th>
                      <th style={styles.th}>IA Foto</th>
                      <th style={styles.th}>Estado</th>
                      <th style={styles.thCenter}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkpoints.map((checkItem) => (
                      <tr key={checkItem.id} style={styles.tr}>
                        <td style={styles.tdOrder}>#{checkItem.executionOrder}</td>
                        <td style={styles.tdBold}>{checkItem.name}</td>
                        <td style={styles.td}>
                          <span style={styles.nfcBadge}>{checkItem.nfcTagCode}</span>
                        </td>
                        <td style={styles.td}>{checkItem.locationDescription || 'N/A'}</td>
                        <td style={styles.tdInst}>{checkItem.instruction || 'N/A'}</td>
                        <td style={styles.td}>
                          {checkItem.requiresPhoto ? (
                            <span style={styles.iaActiveBadge} title="Exige fotografía del checkpoint">
                              <Camera size={12} /> Exige
                            </span>
                          ) : (
                            <span style={styles.iaInactiveBadge}>Opcional</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: checkItem.status === 1 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: checkItem.status === 1 ? '#10b981' : '#f87171'
                          }}>
                            {checkItem.status === 1 ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td style={styles.tdCenter}>
                          <div style={styles.actionRow}>
                            <button 
                              onClick={() => handleOpenEditCheck(checkItem)}
                              style={styles.editIconBtn}
                              title="Editar checkpoint"
                              aria-label="Editar checkpoint"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => handleToggleCheckStatus(checkItem)}
                              style={checkItem.status === 1 ? styles.deactivateCheckBtn : styles.activateCheckBtn}
                              disabled={checkActionLoadingId === checkItem.id}
                              title={checkItem.status === 1 ? 'Desactivar checkpoint' : 'Activar checkpoint'}
                              aria-label={checkItem.status === 1 ? 'Desactivar checkpoint' : 'Activar checkpoint'}
                            >
                              {checkActionLoadingId === checkItem.id ? (
                                <Loader2 size={12} className="spin-animation" />
                              ) : checkItem.status === 1 ? (
                                'Desactivar'
                              ) : (
                                'Activar'
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
          </>
        ) : (
          <div style={styles.noSelectedState}>
            <Building2 size={48} color="#475569" />
            <h4 style={styles.noSelectedTitle}>Selecciona una Sede</h4>
            <p style={styles.noSelectedDesc}>
              Elige una instalación de la columna izquierda para administrar y visualizar sus puntos de patrullaje NFC.
            </p>
          </div>
        )}
      </div>

      {/* ==========================================================================
         MODAL CREAR / EDITAR INSTALACIÓN
         ========================================================================== */}
      {showInstModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {instModalMode === 'create' ? 'Registrar Nueva Instalación' : 'Editar Sede de Seguridad'}
              </h3>
              <button onClick={() => setShowInstModal(false)} style={styles.closeBtn} title="Cerrar modal" aria-label="Cerrar modal">
                <X size={20} color="#94a3b8" />
              </button>
            </div>

            {instError && (
              <div style={styles.errorAlert}>
                <ShieldAlert size={16} />
                <span>{instError}</span>
              </div>
            )}

            <form onSubmit={handleSaveInst} style={styles.modalForm}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nombre de la Instalación</label>
                <input 
                  type="text" 
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  placeholder="ej. DATRAH Edificio Corporativo"
                  className="input-premium"
                  required
                />
              </div>

              <div style={{ ...styles.inputGroup, position: 'relative' }}>
                <label style={styles.label}>Dirección Comercial</label>
                <input 
                  type="text" 
                  value={instAddress}
                  onChange={(e) => setInstAddress(e.target.value)}
                  placeholder="ej. Av. Vitacura 5400, Santiago"
                  className="input-premium"
                  required
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    marginTop: '4px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {suggestions.map((item, index) => (
                      <div 
                        key={item.place_id || index}
                        onClick={() => handleSelectSuggestion(item)}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #334155',
                          fontSize: '13px',
                          color: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <MapPin size={14} color="#94a3b8" />
                        <span>{item.formatted_address}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={styles.grid2}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Cliente Mandante</label>
                  <input 
                    type="text" 
                    value={instClientName}
                    onChange={(e) => setInstClientName(e.target.value)}
                    placeholder="ej. Datrah Systems S.A."
                    className="input-premium"
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Comuna / Ciudad</label>
                  <input 
                    type="text" 
                    value={instLocation}
                    onChange={(e) => setInstLocation(e.target.value)}
                    placeholder="ej. Las Condes"
                    className="input-premium"
                  />
                </div>
              </div>

              <div style={styles.infoAlert}>
                <Info size={14} color="#3b82f6" />
                <span style={styles.infoText}>Define la geocerca para auditar las rondas del personal en terreno.</span>
              </div>

              <div style={styles.grid3}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Latitud</label>
                  <input 
                    type="number" 
                    step="0.000001"
                    value={instLat}
                    onChange={(e) => setInstLat(e.target.value)}
                    className="input-premium"
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Longitud</label>
                  <input 
                    type="number" 
                    step="0.000001"
                    value={instLng}
                    onChange={(e) => setInstLng(e.target.value)}
                    className="input-premium"
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Radio (Metros)</label>
                  <input 
                    type="number" 
                    value={instRadius}
                    onChange={(e) => setInstRadius(e.target.value)}
                    className="input-premium"
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={captureGPSLocation}
                className="btn-secondary"
                style={{
                  width: '100%',
                  marginTop: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  color: '#60a5fa',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'background-color 0.2s'
                }}
              >
                <MapPin size={16} />
                Capturar Mi Ubicación GPS Actual
              </button>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowInstModal(false)} className="btn-secondary" style={styles.modalActionBtn}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={styles.modalActionBtn} disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <Loader2 size={16} className="spin-animation" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    'Guardar Sede'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================================
         MODAL CREAR / EDITAR CHECKPOINT NFC
         ========================================================================== */}
      {showCheckModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {checkModalMode === 'create' ? 'Añadir Checkpoint NFC' : 'Modificar Checkpoint'}
              </h3>
              <button onClick={() => setShowCheckModal(false)} style={styles.closeBtn} title="Cerrar modal" aria-label="Cerrar modal">
                <X size={20} color="#94a3b8" />
              </button>
            </div>

            {checkError && (
              <div style={styles.errorAlert}>
                <ShieldAlert size={16} />
                <span>{checkError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCheck} style={styles.modalForm}>
              <div style={styles.grid2}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Nombre del Punto</label>
                  <input 
                    type="text" 
                    value={checkName}
                    onChange={(e) => setCheckName(e.target.value)}
                    placeholder="ej. Puerta de Bodega Sur"
                    className="input-premium"
                    required
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Orden de Recorrido</label>
                  <input 
                    type="number" 
                    value={checkOrder}
                    onChange={(e) => setCheckOrder(e.target.value)}
                    className="input-premium"
                    required
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Código del Tag NFC (Lectura única)</label>
                <input 
                  type="text" 
                  value={checkNfcCode}
                  onChange={(e) => setCheckNfcCode(e.target.value)}
                  placeholder="ej. SIS_NFC_BOD_04"
                  className="input-premium"
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Detalle de Ubicación Física</label>
                <input 
                  type="text" 
                  value={checkLocDesc}
                  onChange={(e) => setCheckLocDesc(e.target.value)}
                  placeholder="ej. Al costado derecho del portón de emergencias"
                  className="input-premium"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Instrucción Operativa para el Guardia</label>
                <textarea 
                  value={checkInstruction}
                  onChange={(e) => setCheckInstruction(e.target.value)}
                  placeholder="ej. Asegurar que el candado de seguridad esté cerrado y verificar la grilla de sensores."
                  className="input-premium"
                  style={styles.textarea}
                />
              </div>

              <div style={styles.checkboxGroup}>
                <input 
                  type="checkbox" 
                  id="requiresPhoto"
                  checked={checkRequiresPhoto}
                  onChange={(e) => setCheckRequiresPhoto(e.target.checked)}
                  style={styles.checkbox}
                />
                <label htmlFor="requiresPhoto" style={styles.checkboxLabel}>
                  <strong>Exigir captura fotográfica con Inteligencia Artificial (IA)</strong>
                  <span style={styles.checkboxDesc}>El guardia deberá capturar evidencia visual del checkpoint para corroborar presencia efectiva.</span>
                </label>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowCheckModal(false)} className="btn-secondary" style={styles.modalActionBtn}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={styles.modalActionBtn} disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <Loader2 size={16} className="spin-animation" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    'Guardar Punto'
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
    display: 'grid',
    gridTemplateColumns: '1.2fr 2fr',
    gap: '24px',
    height: 'calc(100vh - 140px)',
  },
  leftCol: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    overflow: 'hidden',
    height: '100%',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  rightCol: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    overflow: 'hidden',
    height: '100%',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '16px',
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#ffffff',
  },
  subSubtitle: {
    fontSize: '12.5px',
    color: '#94a3b8',
    marginTop: '2px',
    display: 'block',
  },
  addBtn: {
    padding: '8px 12px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  addBtnCheck: {
    padding: '8px 14px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  scrollList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    overflowY: 'auto',
    flex: 1,
    paddingRight: '4px',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '16px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    transition: 'border-color var(--transition-fast), background-color var(--transition-fast)',
  },
  cardActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.03)',
    border: '1px solid #3b82f6',
    padding: '16px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderRadius: 'var(--radius-md)',
    boxShadow: '0 0 12px rgba(59, 130, 246, 0.1)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '10px',
  },
  cardTitleInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  instName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
  },
  clientName: {
    fontSize: '11.5px',
    color: '#3b82f6',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  statusBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: '12.5px',
    color: '#94a3b8',
    margin: 0,
  },
  geoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    fontSize: '11.5px',
    color: '#64748b',
  },
  geoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  cardActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '6px',
    borderTop: '1px solid rgba(255, 255, 255, 0.03)',
    paddingTop: '10px',
  },
  actionBtn: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '6px',
    color: '#cbd5e1',
    padding: '4px 10px',
    fontSize: '11.5px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
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
    marginLeft: 'auto',
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
    padding: '20px',
  },
  emptyText: {
    fontSize: '13.5px',
    color: '#64748b',
    fontWeight: '600',
  },
  emptySub: {
    fontSize: '12px',
    color: '#475569',
    maxWidth: '280px',
    marginTop: '-6px',
  },
  noSelectedState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: '16px',
    textAlign: 'center',
    padding: '40px',
  },
  noSelectedTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#ffffff',
    marginTop: '8px',
  },
  noSelectedDesc: {
    fontSize: '13px',
    color: '#64748b',
    maxWidth: '300px',
  },
  tableWrapper: {
    width: '100%',
    overflowY: 'auto',
    flex: 1,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 14px',
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    textAlign: 'left',
  },
  thCenter: {
    padding: '12px 14px',
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    textAlign: 'center',
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
  },
  td: {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#cbd5e1',
  },
  tdBold: {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#ffffff',
    fontWeight: '700',
  },
  tdOrder: {
    padding: '12px 14px',
    fontSize: '12.5px',
    color: '#3b82f6',
    fontWeight: '700',
  },
  tdInst: {
    padding: '12px 14px',
    fontSize: '12px',
    color: '#94a3b8',
    maxWidth: '180px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tdCenter: {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#cbd5e1',
    textAlign: 'center',
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  nfcBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#3b82f6',
    fontWeight: '600',
  },
  iaActiveBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    color: '#10b981',
    borderRadius: '4px',
    padding: '2px 6px',
    fontSize: '11px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
  },
  iaInactiveBadge: {
    color: '#64748b',
    fontSize: '11.5px',
  },
  editIconBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    transition: 'color var(--transition-fast)',
  },
  deactivateCheckBtn: {
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '4px',
    background: 'transparent',
    color: '#f87171',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  activateCheckBtn: {
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '4px',
    background: 'transparent',
    color: '#10b981',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
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
    maxWidth: '520px',
    padding: '30px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  modalTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '18px',
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
  infoAlert: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.15)',
    borderRadius: '8px',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  infoText: {
    color: '#93c5fd',
    fontSize: '12px',
    fontWeight: '500',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '16px',
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
    minHeight: '80px',
    resize: 'vertical',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    padding: '12px',
  },
  checkbox: {
    marginTop: '3px',
    cursor: 'pointer',
    width: '16px',
    height: '16px',
  },
  checkboxLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    cursor: 'pointer',
    fontSize: '12.5px',
    color: '#cbd5e1',
  },
  checkboxDesc: {
    fontSize: '11.5px',
    color: '#64748b',
  },
  modalActions: {
    display: 'flex',
    gap: '16px',
    marginTop: '10px',
  },
  modalActionBtn: {
    flex: 1,
  },
};
