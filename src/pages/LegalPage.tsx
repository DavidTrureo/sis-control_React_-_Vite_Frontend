import { useState } from 'react';
import { Shield, FileText, ArrowLeft, ExternalLink, Lock, CheckCircle2 } from 'lucide-react';
import logoImg from '../assets/logo.png';

interface LegalPageProps {
  initialTab?: 'privacy' | 'terms';
  onBack?: () => void;
}

export default function LegalPage({ initialTab = 'privacy', onBack }: LegalPageProps) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div style={styles.container}>
      {/* Background Glows */}
      <div style={styles.glow1}></div>
      <div style={styles.glow2}></div>

      {/* Top Navigation */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <button style={styles.backBtn} onClick={handleBack}>
            <ArrowLeft size={18} />
            <span>Volver al Sistema</span>
          </button>

          <div style={styles.brandBadge}>
            <img src={logoImg} alt="SIS-Control" style={styles.logoImg} />
            <div>
              <span style={styles.brandTitle}>SIS-CONTROL</span>
              <span style={styles.brandSubtitle}>Marco Legal y Transparencia</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={styles.main}>
        {/* Hero Section */}
        <div style={styles.hero}>
          <div style={styles.heroBadge}>
            <Lock size={14} color="#60a5fa" />
            <span>Documentación Legal Corporativa • Chile</span>
          </div>
          <h1 style={styles.heroTitle}>
            Términos Legales y Protección de Datos
          </h1>
          <p style={styles.heroSubtitle}>
            En SIS-Control garantizamos la máxima transparencia y resguardo de la privacidad laboral y operacional, en estricto apego a la Ley N° 19.628, el Código del Trabajo y las normativas OS-10 de Carabineros de Chile.
          </p>

          {/* Segmented Switcher */}
          <div style={styles.tabSwitcher}>
            <button
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'privacy' ? styles.tabBtnActive : {})
              }}
              onClick={() => setActiveTab('privacy')}
            >
              <Shield size={18} />
              <span>Política de Privacidad</span>
            </button>
            <button
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'terms' ? styles.tabBtnActive : {})
              }}
              onClick={() => setActiveTab('terms')}
            >
              <FileText size={18} />
              <span>Condiciones del Servicio</span>
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="glass-panel" style={styles.card}>
          {activeTab === 'privacy' ? (
            <div style={styles.documentBody}>
              <div style={styles.docHeader}>
                <div style={styles.docIconBox}>
                  <Shield size={28} color="#3b82f6" />
                </div>
                <div>
                  <h2 style={styles.docTitle}>Política de Privacidad y Tratamiento de Datos Personales</h2>
                  <p style={styles.docDate}>Última actualización: 16 de noviembre de 2026 • Versión 2.0</p>
                </div>
              </div>

              <div style={styles.alertBox}>
                <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={styles.alertText}>
                  <strong>Garantía Laboral (Ley N° 21.719 / Dirección del Trabajo):</strong> La geolocalización GPS opera <em>única y exclusivamente</em> mientras el usuario mantiene una jornada o ronda activa. Fuera de su turno laboral convenido, el monitoreo por satélite permanece 100% inactivo.
                </p>
              </div>

              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>1. Identificación del Responsable</h3>
                <p style={styles.p}>
                  La plataforma <strong>SIS-Control</strong> (aplicación móvil y consola web de operaciones) es desarrollada y operada por <strong>Datrah Systems S.A. / Vito Datrah Innovations</strong>, con domicilio en Santiago de Chile. Para cualquier solicitud formal relativa al tratamiento de sus datos personales, nuestro canal oficial es el correo: <a href="mailto:privacidad@siscontrol.com" style={styles.link}>privacidad@siscontrol.com</a>.
                </p>
              </section>

              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>2. Marco Legal Aplicable</h3>
                <p style={styles.p}>
                  El tratamiento de datos personales efectuado por SIS-Control se rige estrictamente por el marco jurídico de la República de Chile:
                </p>
                <ul style={styles.ul}>
                  <li style={styles.li}><strong>Ley N° 19.628:</strong> Sobre Protección de la Vida Privada y Protección de Datos Personales.</li>
                  <li style={styles.li}><strong>Artículo 19 N° 4 de la Constitución Política:</strong> Respeto y protección a la vida privada y a la honra de la persona y su familia.</li>
                  <li style={styles.li}><strong>Código del Trabajo y Dictámenes DT:</strong> Directrices sobre medios tecnológicos de control y fiscalización de trabajadores.</li>
                  <li style={styles.li}><strong>Ley N° 3.607 y D.S. 93:</strong> Normativas de Seguridad Privada OS-10 de Carabineros de Chile para acreditación de rondas y libro de novedades.</li>
                </ul>
              </section>

              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>3. Datos Recopilados y Mecanismos de Captura</h3>
                <p style={styles.p}>
                  SIS-Control recopila únicamente los datos estrictamente necesarios para la prestación eficiente y segura de los servicios:
                </p>
                <ul style={styles.ul}>
                  <li style={styles.li}><strong>Datos de Identificación Personal:</strong> Nombre completo, RUT/RUN, correo electrónico laboral, nombre de usuario, rol operativo asignado (Guardia, Supervisor, Administrador) y fotografía de perfil para credencialización interna.</li>
                  <li style={styles.li}><strong>Geolocalización GPS Operacional:</strong> Coordenadas geográficas de latitud y longitud, precisión estimada y verificación de perímetro geocercado respecto a la instalación asignada.</li>
                  <li style={styles.li}><strong>Evidencia Fotográfica y Checkpoints:</strong> Identificadores de tags NFC y códigos QR escaneados en cada puesto de control, marcas de tiempo fidedignas y fotografías capturadas mediante la cámara como evidencia de novedades o anomalías.</li>
                  <li style={styles.li}><strong>Sensores de Movimiento y Control de Presencia ("Hombre Vivo"):</strong> Acelerómetro para activación de emergencias por agitación y confirmación periódica de vigilia y presencia en caseta.</li>
                  <li style={styles.li}><strong>Identificadores Técnicos:</strong> Tokens de notificaciones push para despacho instantáneo de alarmas SOS y asignación de turnos.</li>
                </ul>
              </section>

              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>4. Finalidad del Tratamiento</h3>
                <p style={styles.p}>
                  Los datos recogidos son tratados con las siguientes finalidades operacionales exclusivas:
                </p>
                <ul style={styles.ul}>
                  <li style={styles.li}>Coordinar la respuesta inmediata y despacho de auxilio ante la activación del <strong>Botón de Pánico</strong> o emergencias médicas en puesto.</li>
                  <li style={styles.li}>Acreditar fehacientemente la presencialidad, recorrido y cumplimiento de las rondas de patrullaje preventivo.</li>
                  <li style={styles.li}>Certificar la asistencia laboral del guardia de seguridad ante su empleador y los organismos fiscalizadores.</li>
                  <li style={styles.li}>Generar informes ejecutivos consolidados e historiales de auditoría para los administradores de los recintos protegidos.</li>
                </ul>
              </section>

              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>5. Seguridad, Cifrado y Retención</h3>
                <p style={styles.p}>
                  Implementamos altos estándares de ciberseguridad industrial:
                </p>
                <ul style={styles.ul}>
                  <li style={styles.li}><strong>Cifrado en Tránsito:</strong> Tráfico cifrado mediante protocolos <strong>TLS 1.3 / HTTPS</strong> con HSTS estricto.</li>
                  <li style={styles.li}><strong>Cifrado en Reposo:</strong> Bases de datos en la nube protegidas mediante cifrado <strong>AES-256</strong>.</li>
                  <li style={styles.li}><strong>Almacenamiento Local Seguro:</strong> Contraseñas procesadas mediante hash criptográfico <strong>BCrypt</strong> y tokens en enclaves de hardware seguro (iOS Keychain / Android Keystore).</li>
                  <li style={styles.li}><strong>Aislamiento y Auditoría:</strong> Control de acceso basado en roles (RBAC) con protección anti-IDOR y bitácora forense de auditoría inmutable.</li>
                </ul>
              </section>

              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>6. No Venta de Datos y Cesión a Terceros</h3>
                <p style={styles.p}>
                  <strong>SIS-Control bajo ninguna circunstancia vende, alquila, cede ni comercializa datos personales de sus usuarios con terceros</strong>, ni utiliza la información para fines publicitarios o de elaboración de perfiles comerciales. La información solo es accesible por el personal de supervisión autorizado de la empresa y, en caso de ser requerido formalmente, por el Ministerio Público o Carabineros de Chile para fines de investigación penal.
                </p>
              </section>

              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>7. Ejercicio de Derechos ARCO</h3>
                <p style={styles.p}>
                  Conforme a la Ley N° 19.628, todo titular de datos tiene derecho a solicitar el <strong>Acceso, Rectificación, Cancelación u Oposición</strong> de sus datos personales. Para ejercer estos derechos, debe remitir una solicitud escrita a <a href="mailto:privacidad@siscontrol.com" style={styles.link}>privacidad@siscontrol.com</a> acreditando su identidad.
                </p>
              </section>
            </div>
          ) : (
            <div style={styles.documentBody}>
              <div style={styles.docHeader}>
                <div style={{ ...styles.docIconBox, backgroundColor: 'rgba(139, 92, 246, 0.12)', borderColor: 'rgba(139, 92, 246, 0.25)' }}>
                  <FileText size={28} color="#a78bfa" />
                </div>
                <div>
                  <h2 style={styles.docTitle}>Condiciones Generales del Servicio (Términos de Uso)</h2>
                  <p style={styles.docDate}>Última actualización: 16 de noviembre de 2026 • Versión 2.0</p>
                </div>
              </div>

              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>1. Naturaleza y Aceptación del Servicio</h3>
                <p style={styles.p}>
                  Las presentes Condiciones del Servicio regulan el uso de la plataforma <strong>SIS-Control</strong>, provista por Datrah Systems S.A. como software especializado para la gestión, control de asistencia, trazabilidad de rondas con verificación NFC y gestión de alertas de seguridad. El acceso a la plataforma o la descarga de sus aplicaciones móviles constituye la aceptación íntegra de estas condiciones.
                </p>
              </section>

              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>2. Cuentas de Usuario y Seguridad de Credenciales</h3>
                <p style={styles.p}>
                  El acceso a SIS-Control requiere una cuenta asignada por el administrador corporativo. El usuario se compromete a:
                </p>
                <ul style={styles.ul}>
                  <li style={styles.li}>Mantener la confidencialidad absoluta de su contraseña y clave de acceso.</li>
                  <li style={styles.li}>No compartir, transferir ni delegar el uso de su cuenta a terceros bajo ningún pretexto.</li>
                  <li style={styles.li}>Notificar de inmediato a la supervisión cualquier sospecha de acceso no autorizado o pérdida de su dispositivo móvil asignado.</li>
                </ul>
              </section>

              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>3. Reglas de Conducta y Prohibición de Fraude (Anti-Spoofing)</h3>
                <p style={styles.p}>
                  Queda terminantemente prohibido incurrir en cualquiera de las siguientes conductas, las cuales serán consideradas faltas operacionales y laborales graves:
                </p>
                <ul style={styles.ul}>
                  <li style={styles.li}><strong>Falsificación de Ubicación:</strong> El empleo de herramientas de simulación de GPS (Fake GPS / GPS Spoofing) o emuladores de software para falsear la presencia física en el puesto.</li>
                  <li style={styles.li}><strong>Duplicación de Tags NFC:</strong> Intentar clonar o emular identificadores NFC con dispositivos externos para registrar rondas sin realizar el patrullaje presencial.</li>
                  <li style={styles.li}><strong>Alteración de Evidencia:</strong> Cargar fotografías manipuladas, repetidas o no correspondientes a la inspección real del checkpoint.</li>
                  <li style={styles.li}><strong>Inactividad Deliberada:</strong> Apagar deliberadamente los sensores o desatender de forma negligente y reiterada los controles de presencia ("Hombre Vivo").</li>
                </ul>
              </section>

              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>4. Protocolo y Uso Responsable del Botón de Pánico</h3>
                <p style={styles.p}>
                  El <strong>Botón Deslizable de Pánico (SOS)</strong> es un canal de auxilio prioritario que dispara alertas visuales y sonoras en la central de monitoreo y notificaciones push a todos los supervisores disponibles. Debe ser activado exclusivamente ante situaciones de:
                </p>
                <ul style={styles.ul}>
                  <li style={styles.li}>Intrusión violenta o asalto a las dependencias vigiladas.</li>
                  <li style={styles.li}>Riesgo inminente para la vida o salud de los guardias o habitantes de la instalación.</li>
                  <li style={styles.li}>Siniestros mayores (incendios, fugas químicas o emergencias estructurales).</li>
                </ul>
                <p style={styles.p}>
                  El uso malicioso, abusivo o en tono de broma del botón de pánico dará lugar a medidas disciplinarias inmediatas y eventuales responsabilidades legales.
                </p>
              </section>

              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>5. Disponibilidad y Factores Exógenos de Red</h3>
                <p style={styles.p}>
                  SIS-Control está diseñado con resiliencia ante cortes temporales de conectividad, permitiendo almacenar escaneos en memoria local y sincronizarlos al recuperar cobertura. No obstante, el usuario comprende que la transmisión instantánea depende de la disponibilidad de redes de telecomunicaciones (4G/5G/Wi-Fi) de las empresas operadoras y de la cobertura satelital GPS en zonas subterráneas o blindadas.
                </p>
              </section>

              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>6. Propiedad Intelectual</h3>
                <p style={styles.p}>
                  Todos los derechos de autor, patentes, marcas comerciales, diseños de interfaz, código fuente y compilaciones pertenecen de manera privativa a Datrah Systems S.A. / Vito Datrah Innovations. Se prohíbe cualquier intento de descompilación, ingeniería inversa o copia no autorizada.
                </p>
              </section>

              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>7. Jurisdicción y Ley Aplicable</h3>
                <p style={styles.p}>
                  Las presentes condiciones se interpretarán con arreglo a las leyes de la República de Chile. Para cualquier controversia, las partes fijan su domicilio en la ciudad de Santiago de Chile y se someten a la competencia de sus Tribunales Ordinarios de Justicia.
                </p>
              </section>
            </div>
          )}

          {/* Footer Contact */}
          <div style={styles.cardFooter}>
            <div style={styles.footerContact}>
              <span style={styles.contactLabel}>¿Dudas o consultas sobre estos documentos?</span>
              <a href="mailto:soporte@siscontrol.com" style={styles.contactLink}>
                <span>Contactar a Soporte y Legal (soporte@siscontrol.com)</span>
                <ExternalLink size={14} />
              </a>
            </div>

            <button style={styles.btnAceptar} onClick={handleBack}>
              Entendido y Volver
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#030712',
    color: '#e2e8f0',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    position: 'relative',
    overflowX: 'hidden',
    paddingBottom: '80px',
  },
  glow1: {
    position: 'absolute',
    top: '-150px',
    left: '20%',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(29, 78, 216, 0.15) 0%, rgba(3, 7, 18, 0) 70%)',
    pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute',
    top: '30%',
    right: '-100px',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(3, 7, 18, 0) 70%)',
    pointerEvents: 'none',
  },
  header: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(3, 7, 18, 0.8)',
    backdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  headerContent: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#cbd5e1',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13.5px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  brandBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoImg: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
  },
  brandTitle: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '0.5px',
  },
  brandSubtitle: {
    display: 'block',
    fontSize: '11.5px',
    color: '#64748b',
    fontWeight: '500',
  },
  main: {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '40px 24px 0 24px',
    position: 'relative',
    zIndex: 10,
  },
  hero: {
    textAlign: 'center',
    marginBottom: '36px',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    padding: '5px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#60a5fa',
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  heroTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: '12px',
    letterSpacing: '-0.5px',
  },
  heroSubtitle: {
    fontSize: '15px',
    color: '#94a3b8',
    maxWidth: '720px',
    margin: '0 auto 28px auto',
    lineHeight: '1.6',
  },
  tabSwitcher: {
    display: 'inline-flex',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '6px',
    gap: '6px',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 22px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabBtnActive: {
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(29, 78, 216, 0.35)',
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '36px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
  },
  documentBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  docHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    paddingBottom: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  docIconBox: {
    width: '54px',
    height: '54px',
    borderRadius: '12px',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  docTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: '4px',
  },
  docDate: {
    fontSize: '12.5px',
    color: '#64748b',
    fontWeight: '500',
  },
  alertBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: '10px',
    padding: '14px 18px',
  },
  alertText: {
    fontSize: '13.5px',
    color: '#a7f3d0',
    lineHeight: '1.5',
    margin: 0,
  },
  section: {
    marginTop: '6px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#60a5fa',
    marginBottom: '10px',
    letterSpacing: '0.2px',
  },
  p: {
    fontSize: '14.5px',
    color: '#cbd5e1',
    lineHeight: '1.7',
    margin: '0 0 10px 0',
  },
  ul: {
    paddingLeft: '20px',
    margin: '0 0 10px 0',
  },
  li: {
    fontSize: '14px',
    color: '#94a3b8',
    lineHeight: '1.7',
    marginBottom: '6px',
  },
  link: {
    color: '#60a5fa',
    textDecoration: 'none',
    fontWeight: '600',
  },
  cardFooter: {
    marginTop: '36px',
    paddingTop: '24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
  },
  footerContact: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  contactLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500',
  },
  contactLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#38bdf8',
    fontSize: '13.5px',
    fontWeight: '600',
    textDecoration: 'none',
  },
  btnAceptar: {
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

