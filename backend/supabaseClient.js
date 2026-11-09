const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const LOCAL_DB_PATH = path.join(DATA_DIR, 'cotizaciones.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify([], null, 2), 'utf8');
  }
}

function readLocalQuotes() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function writeLocalQuotes(quotes) {
  ensureDataDir();
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(quotes, null, 2), 'utf8');
}

function getSupabaseConfig() {
  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();

  const isConfigured =
    Boolean(url) &&
    Boolean(key) &&
    !url.includes('tu-proyecto-id') &&
    !key.includes('tu-service-role-key') &&
    !key.includes('tu-anon-public-key');

  return { url, key, isConfigured };
}

/**
 * Obtiene instancia de @supabase/supabase-js si el paquete está instalado,
 * o utiliza fetch nativo contra la REST API PostgREST de Supabase.
 */
function getSdkClient(url, key) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  } catch (_) {
    return null;
  }
}

/**
 * Inserta una nueva cotización en Supabase PostgreSQL (tabla public.cotizaciones)
 * y guarda respaldo en data/cotizaciones.json.
 */
async function createQuoteRecord(payload) {
  const nowIso = new Date().toISOString();
  const record = {
    codigo_referencia: payload.codigo_referencia,
    nombre_contacto: payload.nombre_contacto,
    empresa: payload.empresa,
    email: payload.email,
    telefono: payload.telefono,
    provincia_origen: payload.provincia_origen,
    localidad_origen: payload.localidad_origen,
    destino_region: payload.destino_region,
    destino_etiqueta: payload.destino_etiqueta,
    localidad_destino: payload.localidad_destino,
    tipo_carga: payload.tipo_carga,
    peso_toneladas: Number(payload.peso_toneladas),
    fecha_estimada: payload.fecha_estimada || null,
    observaciones: payload.observaciones || null,
    corredor_sugerido: payload.corredor_sugerido,
    distancia_estimada_km: Number(payload.distancia_estimada_km || 0),
    sla_estimado: payload.sla_estimado,
    estado: payload.estado || 'pendiente',
    email_notificado: Boolean(payload.email_notificado),
    origen_solicitud: payload.origen_solicitud || 'web_b2b'
  };

  const { url, key, isConfigured } = getSupabaseConfig();
  let savedInSupabase = false;
  let supabaseError = null;
  let dbRow = null;

  if (isConfigured) {
    try {
      const sdk = getSdkClient(url, key);
      if (sdk) {
        const { data, error } = await sdk
          .from('cotizaciones')
          .insert([record])
          .select()
          .single();
        if (error) throw new Error(error.message);
        dbRow = data;
        savedInSupabase = true;
      } else {
        const response = await fetch(`${url}/rest/v1/cotizaciones`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: key,
            Authorization: `Bearer ${key}`,
            Prefer: 'return=representation'
          },
          body: JSON.stringify(record)
        });
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Supabase REST ${response.status}: ${errText}`);
        }
        const rows = await response.json();
        dbRow = Array.isArray(rows) ? rows[0] : rows;
        savedInSupabase = true;
      }
    } catch (err) {
      supabaseError = err.message;
      console.warn('[Supabase] Aviso al insertar en nube (usando respaldo local):', err.message);
    }
  }

  // Guardar siempre también en el espejo local data/cotizaciones.json
  const quotes = readLocalQuotes();
  const localEntry = dbRow || {
    id: quotes.length + 1,
    ...record,
    created_at: nowIso,
    updated_at: nowIso
  };
  quotes.unshift(localEntry);
  writeLocalQuotes(quotes);

  return {
    quote: localEntry,
    storage: savedInSupabase ? 'supabase_cloud' : 'local_backup',
    supabaseConfigured: isConfigured,
    supabaseError
  };
}

/**
 * Actualiza el indicador email_notificado o el estado de una cotización.
 */
async function updateQuoteRecord(codigoReferencia, fields) {
  const code = String(codigoReferencia || '').trim().toUpperCase();
  const { url, key, isConfigured } = getSupabaseConfig();

  if (isConfigured) {
    try {
      const sdk = getSdkClient(url, key);
      if (sdk) {
        await sdk
          .from('cotizaciones')
          .update(fields)
          .eq('codigo_referencia', code);
      } else {
        await fetch(
          `${url}/rest/v1/cotizaciones?codigo_referencia=eq.${encodeURIComponent(code)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              apikey: key,
              Authorization: `Bearer ${key}`
            },
            body: JSON.stringify(fields)
          }
        );
      }
    } catch (err) {
      console.warn('[Supabase] No se pudo actualizar en nube:', err.message);
    }
  }

  const quotes = readLocalQuotes();
  const idx = quotes.findIndex(
    (q) => String(q.codigo_referencia).toUpperCase() === code
  );
  if (idx !== -1) {
    quotes[idx] = {
      ...quotes[idx],
      ...fields,
      updated_at: new Date().toISOString()
    };
    writeLocalQuotes(quotes);
    return quotes[idx];
  }
  return null;
}

/**
 * Busca una cotización por su código de referencia (ej. EXP38-4821).
 */
async function getQuoteByCode(codigoReferencia) {
  const code = String(codigoReferencia || '').trim().toUpperCase();
  const { url, key, isConfigured } = getSupabaseConfig();

  if (isConfigured) {
    try {
      const sdk = getSdkClient(url, key);
      if (sdk) {
        const { data, error } = await sdk
          .from('cotizaciones')
          .select('*')
          .eq('codigo_referencia', code)
          .maybeSingle();
        if (!error && data) return { quote: data, source: 'supabase_cloud' };
      } else {
        const response = await fetch(
          `${url}/rest/v1/cotizaciones?codigo_referencia=eq.${encodeURIComponent(code)}&limit=1`,
          {
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`
            }
          }
        );
        if (response.ok) {
          const rows = await response.json();
          if (Array.isArray(rows) && rows.length > 0) {
            return { quote: rows[0], source: 'supabase_cloud' };
          }
        }
      }
    } catch (err) {
      console.warn('[Supabase] Error consultando código en nube:', err.message);
    }
  }

  const quotes = readLocalQuotes();
  const found = quotes.find(
    (q) => String(q.codigo_referencia).toUpperCase() === code
  );
  return found ? { quote: found, source: 'local_backup' } : null;
}

/**
 * Lista las últimas cotizaciones registradas.
 */
async function listQuotes(limit = 50) {
  const { url, key, isConfigured } = getSupabaseConfig();

  if (isConfigured) {
    try {
      const sdk = getSdkClient(url, key);
      if (sdk) {
        const { data, error } = await sdk
          .from('cotizaciones')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (!error && Array.isArray(data)) {
          return { quotes: data, source: 'supabase_cloud' };
        }
      } else {
        const response = await fetch(
          `${url}/rest/v1/cotizaciones?order=created_at.desc&limit=${Number(limit)}`,
          {
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`
            }
          }
        );
        if (response.ok) {
          const rows = await response.json();
          return { quotes: rows, source: 'supabase_cloud' };
        }
      }
    } catch (err) {
      console.warn('[Supabase] Error listando cotizaciones en nube:', err.message);
    }
  }

  const quotes = readLocalQuotes().slice(0, limit);
  return { quotes, source: 'local_backup' };
}

module.exports = {
  getSupabaseConfig,
  createQuoteRecord,
  updateQuoteRecord,
  getQuoteByCode,
  listQuotes
};

