# TRANSPORTE EXPRESO 38 SRL — Plataforma Web & Backend B2B

Sitio web corporativo responsive y backend B2B de **Transporte Expreso 38 S.R.L.** con identidad visual fiel al ploteo de sus unidades Volvo FH, mapa geográfico interactivo Mercosur, galería multimedia real, API de cotizaciones conectada a **Supabase (PostgreSQL)** y notificaciones por correo electrónico (**SMTP / Nodemailer**).

---

## Estructura del Proyecto

- `index.html` — Interfaz B2B responsive (móvil, tablet y escritorio) con cotizador y buscador de estado de solicitud por código (`EXP38-XXXX`).
- `css/styles.css` — Estilos corporativos, animaciones de corredores viales y reglas responsive.
- `js/main.js` — Interactividad del mapa, selector de flota Volvo FH, galería multimedia/Lightbox táctil y cliente HTTP para `/api/cotizaciones`.
- `server.js` — Servidor HTTP + API REST B2B con streaming de video (`HTTP 206 Partial Content`).
- `backend/`
  - `env.js` — Cargador automático de variables `.env` (con o sin `dotenv`).
  - `corridorCalculator.js` — Estimación automática de corredor vial (`RN 3`, `RN 7`, `RN 9`, `RN 14`, `RN 22`, `RN 34`, `RN 40`), kilometraje y SLA.
  - `supabaseClient.js` — Cliente híbrido para **Supabase PostgreSQL** (`@supabase/supabase-js` o REST PostgREST nativo) con espejo local automático en `data/cotizaciones.json`.
  - `mailer.js` — Despacho de correos HTML corporativos a Mesa de Tráfico y al cliente vía **Nodemailer (SMTP)** + archivo auditable en `data/outbox/`.
- `supabase/schema.sql` — Script SQL listo para pegar en el **SQL Editor** de Supabase (tabla `public.cotizaciones`, índices B-Tree, trigger `updated_at` y políticas RLS).
- `.env.example` — Plantilla de variables de entorno para Supabase y SMTP.

---

## Cómo Ejecutar e Integrar Supabase + SMTP

### 1. Crear la tabla en Supabase
1. Entra a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**.
2. Abre el archivo `supabase/schema.sql`, pega su contenido y haz clic en **Run**.

### 2. Configurar variables de entorno (`.env`)
Copia `.env.example` a `.env` en la raíz del proyecto y completa tus credenciales:

```env
PORT=8080
SUPABASE_URL=https://tu-proyecto-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-secreta
SUPABASE_ANON_KEY=tu-anon-public-key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=comercial@expreso38.com
SMTP_PASS=tu-app-password-smtp
SMTP_FROM="Transporte Expreso 38 SRL <comercial@expreso38.com>"
NOTIFY_EMAIL=comercial@expreso38.com
WHATSAPP_NUMBER=5492914276253
```

> **Nota:** Mientras no configures `.env`, el backend funciona inmediatamente en **Modo Respaldo Local**, guardando las cotizaciones en `data/cotizaciones.json` y generando las vistas previas de los correos HTML en `data/outbox/`.

### 3. Instalar paquetes opcionales e iniciar el servidor
```powershell
npm install
npm start
```
*(O directamente `node server.js`, ya que cuenta con clientes nativos integrados).*

---

## Endpoints de la API REST

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Estado del servidor, conexión a Supabase y configuración SMTP |
| `POST` | `/api/cotizaciones` | Registra una cotización, calcula corredor/km, guarda en Supabase y envía emails HTML |
| `GET` | `/api/cotizaciones/:codigo` | Consulta el estado en vivo de una solicitud por su código `EXP38-XXXX` |
| `PATCH` | `/api/cotizaciones/:codigo` | Actualiza el estado (`pendiente`, `en_revision`, `cotizado`, `en_transito`, `completado`, `cancelado`) |
| `GET` | `/api/cotizaciones` | Lista las últimas solicitudes registradas |
