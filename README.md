# SIS-Control Dashboard - Panel de Control Frontend

Este es el panel web de administración y monitoreo en tiempo real de **SIS-Control**, desarrollado con **React (v19)**, **TypeScript** y **Vite**.

El dashboard proporciona una interfaz moderna, interactiva y robusta para supervisores y administradores de seguridad física. Se comunica directamente con la API backend de SIS-Control desarrollada en Java Spring Boot.

---

## 🚀 Características Principales

*   📊 **Panel de Estadísticas y Control (Dashboard):** Visualización interactiva de métricas generales mediante gráficos modernos (líneas, barras, áreas) impulsados por `recharts` que muestran incidentes por severidad, tendencias semanales y estado actual del personal de seguridad.
*   📡 **Monitoreo en Tiempo Real:** Seguimiento en vivo de guardias, rondas activas y checkpoints en un mapa dinámico e interactivo integrado con Leaflet (`react-leaflet`).
*   🚨 **Gestión de Alertas e Incidentes (SOS):** Recepción instantánea de alertas de pánico y reportes de incidentes con su respectiva geolocalización, severidad y flujo de atención / resolución.
*   🧠 **Análisis Predictivo con Inteligencia Artificial (IA):** Generación automática de reportes ejecutivos semanales/diarios y predicciones predictivas de riesgos de seguridad basados en datos históricos.
*   🛡️ **Consola del Supervisor:** Tablero interactivo para el control y asignación inmediata de tareas al personal en servicio.
*   ⚙️ **Administración del Sistema:**
    *   **Usuarios:** Gestión de personal, guardias, supervisores y administradores.
    *   **Instalaciones y Checkpoints:** Alta, baja y georreferenciación de puntos de control habilitados para escaneo NFC/QR.
*   📝 **Bitácora de Auditoría (Audit Logs):** Historial y registros de auditoría detallados del comportamiento del sistema y operaciones de los usuarios.
*   🖨️ **Reportes Imprimibles:** Exportación y formateo óptimo de resúmenes de desempeño del personal y estadísticas de incidentes listos para impresión.

---

## 🛠️ Tecnologías Utilizadas

*   **Framework principal:** React 19 + TypeScript.
*   **Herramienta de compilación (Bundler):** Vite.
*   **Visualización de datos (Gráficos):** Recharts.
*   **Mapas y Geoposicionamiento:** Leaflet & React Leaflet.
*   **Biblioteca de iconos:** Lucide React.
*   **Cliente HTTP:** Axios (con interceptores JWT automáticos de petición y respuesta 401).
*   **Estilos:** Vanilla CSS / CSS Modules enfocados en una experiencia inmersiva y oscura (dark mode).

---

## 📋 Requisitos Previos

Asegúrate de tener instalados los siguientes componentes en tu entorno local:
*   [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
*   [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)
*   El backend de **SIS-Control (Java Spring Boot)** ejecutándose en el puerto `8080`.

---

## 🔧 Instalación y Configuración

1.  **Instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Configuración de la API:**
    El endpoint del backend por defecto apunta a `http://localhost:8080`. Si deseas cambiar esta configuración, puedes editar la variable `API_URL` en [api.ts](file:///Users/vitodatrah/Desktop/SIS-Control-Dashboard/src/services/api.ts):
    ```typescript
    const API_URL = 'http://localhost:8080';
    ```

3.  **Iniciar en entorno de desarrollo:**
    ```bash
    npm run dev
    ```
    El panel estará disponible por defecto en: [http://localhost:5173](http://localhost:5173).

4.  **Generar compilación de producción:**
    ```bash
    npm run build
    ```

---

## 🗂️ Estructura del Proyecto

```text
src/
├── assets/          # Recursos estáticos (Logos, imágenes)
├── components/      # Componentes transversales del sistema (Layouts, etc.)
├── pages/           # Vistas y pantallas principales del dashboard
│   ├── Home.tsx                  # Métricas generales y reportes IA
│   ├── Login.tsx                 # Formulario de autenticación
│   ├── RealTimeMonitor.tsx       # Mapa Leaflet de monitoreo en vivo
│   ├── AlertsAndIncidents.tsx    # Gestión de SOS e incidencias
│   ├── UserManagement.tsx        # CRUD de administradores y guardias
│   ├── InstallationsManagement.tsx# Control de checkpoints NFC e instalaciones
│   ├── SupervisorConsole.tsx     # Consola activa de operaciones
│   └── AuditLog.tsx              # Historial del sistema
├── services/        # Lógica de comunicación con el backend (Axios)
├── App.tsx          # Componente raíz y control de rutas/vistas
├── index.css        # Estilos globales y paleta de colores del diseño
└── main.tsx         # Punto de entrada de la aplicación
```
