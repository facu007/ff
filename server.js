const http = require('http');
const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./backend/env');
const { estimateLogisticsRoute } = require('./backend/corridorCalculator');
const {
  getSupabaseConfig,
  createQuoteRecord,
  updateQuoteRecord,
  getQuoteByCode,
  listQuotes
} = require('./backend/supabaseClient');
const { getSmtpConfig, sendQuoteNotifications } = require('./backend/mailer');

loadEnv();

const PORT = parseInt(process.env.PORT || '8080', 10);
const ROOT = __dirname;
const WHATSAPP_NUMBER = (process.env.WHATSAPP_NUMBER || '5492914276253').replace(/\D/g, '');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8'
};

const VALID_STATES = new Set([
  'pendiente',
  'en_revision',
  'cotizado',
  'en_transito',
  'completado',
  'cancelado'
]);

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token'
  });
  res.end(body);
}

function readJsonBody(req, maxBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > maxBytes) {
        reject(new Error('Payload demasiado grande'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (_) {
        reject(new Error('Formato JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

function generateReferenceCode() {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `EXP38-${randomDigits}`;
}

function buildWhatsappUrl(quote) {
  const lines = [
    `*SOLICITUD DE COTIZACIÓN B2B (${quote.codigo_referencia})*`,
    `• *Empresa:* ${quote.empresa}`,
    `• *Contacto:* ${quote.nombre_contacto} (${quote.telefono} / ${quote.email})`,
    `• *Origen:* ${quote.localidad_origen}, ${quote.provincia_origen}`,
    `• *Destino:* ${quote.localidad_destino} (${quote.destino_etiqueta})`,
    `• *Corredor sugerido:* ${quote.corredor_sugerido} (~${quote.distancia_estimada_km} km)`,
    `• *Carga:* ${quote.tipo_carga} — ${quote.peso_toneladas} Tn`,
    `• *Fecha estimada:* ${quote.fecha_estimada || 'A coordinar'}`,
    `• *Observaciones:* ${quote.observaciones || 'Sin observaciones adicionales'}`
  ];
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}

function isAuthorizedAdmin(req, parsedUrl) {
  const configuredToken = (process.env.ADMIN_TOKEN || '').trim();
  if (!configuredToken) return true;
  const headerToken =
    req.headers['x-admin-token'] ||
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const queryToken = parsedUrl.searchParams.get('token');
  return headerToken === configuredToken || queryToken === configuredToken;
}

async function handleApiRequest(req, res, parsedUrl) {
  const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';

  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  // 1. GET /api/health
  if (req.method === 'GET' && pathname === '/api/health') {
    const supa = getSupabaseConfig();
    const smtp = getSmtpConfig();
    sendJson(res, 200, {
      ok: true,
      service: 'Transporte Expreso 38 SRL — API B2B',
      timestamp: new Date().toISOString(),
      supabase: {
        configured: supa.isConfigured,
        mode: supa.isConfigured ? 'supabase_cloud' : 'local_backup_ready'
      },
      smtp: {
        configured: smtp.isConfigured,
        notifyEmail: smtp.notifyEmail
      }
    });
    return;
  }

  // 2. POST /api/cotizaciones — Crear nueva cotización + Guardar en Supabase + Enviar Email SMTP
  if (req.method === 'POST' && pathname === '/api/cotizaciones') {
    try {
      const body = await readJsonBody(req);

      const nombreContacto = String(body.fullName || body.nombre_contacto || '').trim();
      const empresa = String(body.companyName || body.empresa || '').trim();
      const email = String(body.email || '').trim();
      const telefono = String(body.phone || body.telefono || '').trim();
      const provinciaOrigen = String(body.originProv || body.provincia_origen || '').trim();
      const localidadOrigen = String(body.originCity || body.localidad_origen || '').trim();
      const destinoRegion = String(body.destinationCountry || body.destino_region || '').trim();
      const destinoEtiqueta = String(
        body.destinationLabel || body.destino_etiqueta || destinoRegion
      ).trim();
      const localidadDestino = String(
        body.destinationCity || body.localidad_destino || ''
      ).trim();
      const tipoCarga = String(body.cargoType || body.tipo_carga || '').trim();
      const pesoToneladas = parseFloat(body.cargoWeight ?? body.peso_toneladas);
      const fechaEstimada = String(body.dispatchDate || body.fecha_estimada || '').trim() || null;
      const observaciones = String(body.notes || body.observaciones || '').trim() || null;

      if (
        !nombreContacto ||
        !empresa ||
        !email ||
        !email.includes('@') ||
        !telefono ||
        !provinciaOrigen ||
        !localidadOrigen ||
        !destinoRegion ||
        !localidadDestino ||
        !tipoCarga ||
        isNaN(pesoToneladas) ||
        pesoToneladas <= 0
      ) {
        sendJson(res, 400, {
          ok: false,
          error:
            'Por favor complete todos los campos obligatorios con datos válidos (nombre, empresa, email, teléfono, origen, destino, tipo de carga y tonelaje).'
        });
        return;
      }

      const routeEstimate = estimateLogisticsRoute({
        provinciaOrigen,
        destinoRegion
      });

      const codigoReferencia = generateReferenceCode();

      const createResult = await createQuoteRecord({
        codigo_referencia: codigoReferencia,
        nombre_contacto: nombreContacto,
        empresa,
        email,
        telefono,
        provincia_origen: provinciaOrigen,
        localidad_origen: localidadOrigen,
        destino_region: destinoRegion,
        destino_etiqueta: destinoEtiqueta,
        localidad_destino: localidadDestino,
        tipo_carga: tipoCarga,
        peso_toneladas: pesoToneladas,
        fecha_estimada: fechaEstimada,
        observaciones,
        corredor_sugerido: routeEstimate.corredor,
        distancia_estimada_km: routeEstimate.distanciaKm,
        sla_estimado: routeEstimate.sla,
        estado: 'pendiente',
        email_notificado: false,
        origen_solicitud: 'web_b2b'
      });

      const whatsappUrl = buildWhatsappUrl(createResult.quote);
      const emailResult = await sendQuoteNotifications(createResult.quote, whatsappUrl);

      if (emailResult.sent) {
        await updateQuoteRecord(codigoReferencia, { email_notificado: true });
        createResult.quote.email_notificado = true;
      }

      sendJson(res, 201, {
        ok: true,
        message: 'Cotización registrada correctamente.',
        quote: createResult.quote,
        storage: createResult.storage,
        email: emailResult,
        whatsappUrl
      });
    } catch (err) {
      sendJson(res, 500, {
        ok: false,
        error: err.message || 'Error interno al procesar la cotización.'
      });
    }
    return;
  }

  // 3. GET /api/cotizaciones/:codigo — Consultar estado de una cotización por código EXP38-XXXX
  const codeMatch = pathname.match(/^\/api\/cotizaciones\/([A-Za-z0-9_-]+)$/);
  if (req.method === 'GET' && codeMatch) {
    const code = decodeURIComponent(codeMatch[1]).toUpperCase();
    const result = await getQuoteByCode(code);
    if (!result) {
      sendJson(res, 404, {
        ok: false,
        error: `No se encontró ninguna solicitud con el código ${code}.`
      });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      source: result.source,
      quote: {
        codigo_referencia: result.quote.codigo_referencia,
        empresa: result.quote.empresa,
        nombre_contacto: result.quote.nombre_contacto,
        provincia_origen: result.quote.provincia_origen,
        localidad_origen: result.quote.localidad_origen,
        destino_etiqueta: result.quote.destino_etiqueta,
        localidad_destino: result.quote.localidad_destino,
        tipo_carga: result.quote.tipo_carga,
        peso_toneladas: result.quote.peso_toneladas,
        fecha_estimada: result.quote.fecha_estimada,
        corredor_sugerido: result.quote.corredor_sugerido,
        distancia_estimada_km: result.quote.distancia_estimada_km,
        sla_estimado: result.quote.sla_estimado,
        estado: result.quote.estado,
        email_notificado: result.quote.email_notificado,
        created_at: result.quote.created_at,
        updated_at: result.quote.updated_at
      },
      whatsappUrl: buildWhatsappUrl(result.quote)
    });
    return;
  }

  // 4. PATCH /api/cotizaciones/:codigo — Actualizar estado operativo (Mesa de Tráfico)
  if (req.method === 'PATCH' && codeMatch) {
    if (!isAuthorizedAdmin(req, parsedUrl)) {
      sendJson(res, 401, { ok: false, error: 'No autorizado.' });
      return;
    }
    try {
      const code = decodeURIComponent(codeMatch[1]).toUpperCase();
      const body = await readJsonBody(req);
      const nuevoEstado = String(body.estado || '').trim().toLowerCase();

      if (!VALID_STATES.has(nuevoEstado)) {
        sendJson(res, 400, {
          ok: false,
          error: `Estado inválido. Valores permitidos: ${Array.from(VALID_STATES).join(', ')}`
        });
        return;
      }

      const updated = await updateQuoteRecord(code, { estado: nuevoEstado });
      if (!updated) {
        sendJson(res, 404, { ok: false, error: `No existe la cotización ${code}.` });
        return;
      }

      sendJson(res, 200, { ok: true, quote: updated });
    } catch (err) {
      sendJson(res, 500, { ok: false, error: err.message });
    }
    return;
  }

  // 5. GET /api/cotizaciones — Listar solicitudes recientes
  if (req.method === 'GET' && pathname === '/api/cotizaciones') {
    if (!isAuthorizedAdmin(req, parsedUrl)) {
      sendJson(res, 401, { ok: false, error: 'No autorizado.' });
      return;
    }
    const limit = Math.min(100, Math.max(1, parseInt(parsedUrl.searchParams.get('limit') || '25', 10)));
    const result = await listQuotes(limit);
    sendJson(res, 200, {
      ok: true,
      source: result.source,
      count: result.quotes.length,
      quotes: result.quotes
    });
    return;
  }

  sendJson(res, 404, { ok: false, error: 'Endpoint de API no encontrado.' });
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (parsedUrl.pathname.startsWith('/api/')) {
    handleApiRequest(req, res, parsedUrl);
    return;
  }

  const safePath = path
    .normalize(decodeURIComponent(parsedUrl.pathname))
    .replace(/^(\.\.[\/\\])+/, '');

  // Bloquear acceso directo por HTTP a archivos sensibles del backend
  const lowerNormalized = safePath.replace(/\\/g, '/').toLowerCase();
  if (
    lowerNormalized.startsWith('/backend/') ||
    lowerNormalized.startsWith('backend/') ||
    lowerNormalized.startsWith('/data/') ||
    lowerNormalized.startsWith('data/') ||
    lowerNormalized.startsWith('/supabase/') ||
    lowerNormalized.startsWith('supabase/') ||
    lowerNormalized.includes('.env')
  ) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  const filePath = path.join(
    ROOT,
    safePath === '/' || safePath === '\\' ? 'index.html' : safePath
  );

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const range = req.headers.range;

    // Soporte HTTP Range para streaming y adelantado fluido de videos MP4
    if (range && ext === '.mp4') {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;

      if (start >= stats.size || end >= stats.size || isNaN(start) || isNaN(end)) {
        res.writeHead(416, { 'Content-Range': `bytes */${stats.size}` });
        res.end();
        return;
      }

      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Accept-Ranges': 'bytes'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    const supa = getSupabaseConfig();
    const smtp = getSmtpConfig();
    console.log(`================================================================`);
    console.log(` TRANSPORTE EXPRESO 38 SRL — Servidor Web + API B2B Activo`);
    console.log(` URL Local:     http://localhost:${PORT}`);
    console.log(` API Health:    http://localhost:${PORT}/api/health`);
    console.log(
      ` Base de Datos: ${
        supa.isConfigured
          ? 'Supabase Cloud (PostgreSQL Conectado)'
          : 'Modo Respaldo Local (data/cotizaciones.json) — Pendiente .env Supabase'
      }`
    );
    console.log(
      ` Correo SMTP:   ${
        smtp.isConfigured
          ? `Nodemailer Activo (${smtp.host})`
          : 'Previsualización en data/outbox/ — Pendiente .env SMTP'
      }`
    );
    console.log(`================================================================`);
  });
}

module.exports = { server };
