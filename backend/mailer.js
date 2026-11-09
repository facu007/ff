const fs = require('fs');
const path = require('path');

const OUTBOX_DIR = path.join(__dirname, '..', 'data', 'outbox');

function ensureOutboxDir() {
  if (!fs.existsSync(OUTBOX_DIR)) {
    fs.mkdirSync(OUTBOX_DIR, { recursive: true });
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getSmtpConfig() {
  const host = (process.env.SMTP_HOST || '').trim();
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure =
    process.env.SMTP_SECURE !== undefined
      ? String(process.env.SMTP_SECURE).toLowerCase() === 'true'
      : port === 465;
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const from =
    (process.env.SMTP_FROM || '').trim() ||
    `"Transporte Expreso 38 SRL" <${user || 'comercial@expreso38.com'}>`;
  const notifyEmail =
    (process.env.NOTIFY_EMAIL || '').trim() || 'comercial@expreso38.com';

  const isConfigured =
    Boolean(host) &&
    Boolean(user) &&
    Boolean(pass) &&
    !pass.includes('tu-password-o-app-password-smtp');

  return { host, port, secure, user, pass, from, notifyEmail, isConfigured };
}

/**
 * Construye las plantillas HTML corporativas para Mesa de Tráfico y para el Cliente.
 */
function buildQuoteEmailTemplates(quote, whatsappUrl) {
  const ref = escapeHtml(quote.codigo_referencia);
  const empresa = escapeHtml(quote.empresa);
  const contacto = escapeHtml(quote.nombre_contacto);
  const email = escapeHtml(quote.email);
  const telefono = escapeHtml(quote.telefono);
  const origen = `${escapeHtml(quote.localidad_origen)}, ${escapeHtml(quote.provincia_origen)}`;
  const destino = `${escapeHtml(quote.localidad_destino)} (${escapeHtml(quote.destino_etiqueta)})`;
  const carga = escapeHtml(quote.tipo_carga);
  const peso = escapeHtml(quote.peso_toneladas);
  const fecha = escapeHtml(quote.fecha_estimada || 'A coordinar');
  const corredor = escapeHtml(quote.corredor_sugerido);
  const distancia = escapeHtml(quote.distancia_estimada_km);
  const sla = escapeHtml(quote.sla_estimado);
  const notas = escapeHtml(quote.observaciones || 'Sin observaciones adicionales');

  const adminHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Nueva Cotización B2B ${ref}</title>
</head>
<body style="margin:0;padding:24px;background-color:#0b0e11;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background-color:#15191e;border:1px solid #2b313a;border-radius:6px;overflow:hidden;">
    <tr>
      <td style="background-color:#d71932;padding:18px 24px;color:#ffffff;">
        <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;opacity:0.9;">Mesa de Tráfico · Alerta Operativa B2B</div>
        <div style="font-size:22px;font-weight:800;margin-top:4px;">TRANSPORTE EXPRESO 38 S.R.L.</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <p style="margin:0 0 16px;font-size:15px;color:#cbd5e1;">
          Se ha registrado una nueva solicitud de cotización con código <strong style="color:#ffffff;background:#262c36;padding:3px 8px;border-radius:4px;">${ref}</strong>:
        </p>

        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:14px;background:#101317;border:1px solid #262c36;border-radius:4px;">
          <tr style="border-bottom:1px solid #222831;">
            <td style="color:#94a3b8;width:38%;">Empresa / Razón Social:</td>
            <td style="color:#ffffff;font-weight:700;">${empresa}</td>
          </tr>
          <tr style="border-bottom:1px solid #222831;">
            <td style="color:#94a3b8;">Contacto:</td>
            <td style="color:#ffffff;">${contacto}</td>
          </tr>
          <tr style="border-bottom:1px solid #222831;">
            <td style="color:#94a3b8;">Teléfono / Email:</td>
            <td style="color:#ffffff;">${telefono} · <a href="mailto:${email}" style="color:#ff6b7b;">${email}</a></td>
          </tr>
          <tr style="border-bottom:1px solid #222831;">
            <td style="color:#94a3b8;">Origen de Carga:</td>
            <td style="color:#ffffff;font-weight:600;">${origen}</td>
          </tr>
          <tr style="border-bottom:1px solid #222831;">
            <td style="color:#94a3b8;">Destino:</td>
            <td style="color:#ffffff;font-weight:600;">${destino}</td>
          </tr>
          <tr style="border-bottom:1px solid #222831;">
            <td style="color:#94a3b8;">Corredor Vial Sugerido:</td>
            <td style="color:#fbbf24;font-weight:600;">${corredor} (~${distancia} km)</td>
          </tr>
          <tr style="border-bottom:1px solid #222831;">
            <td style="color:#94a3b8;">Equipo / Tipo de Carga:</td>
            <td style="color:#ffffff;">${carga} — <strong>${peso} Tn</strong></td>
          </tr>
          <tr style="border-bottom:1px solid #222831;">
            <td style="color:#94a3b8;">Fecha Estimada:</td>
            <td style="color:#ffffff;">${fecha}</td>
          </tr>
          <tr>
            <td style="color:#94a3b8;vertical-align:top;">Observaciones:</td>
            <td style="color:#cbd5e1;">${notas}</td>
          </tr>
        </table>

        <div style="margin-top:22px;text-align:center;">
          <a href="${whatsappUrl}" style="display:inline-block;padding:12px 22px;background-color:#16a34a;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;border-radius:4px;">
            Responder al Cliente por WhatsApp
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 24px;background-color:#0f1216;border-top:1px solid #222831;font-size:12px;color:#64748b;text-align:center;">
        TRANSPORTE EXPRESO 38 S.R.L. · comercial@expreso38.com · Adm.: (280) 4873742 (Brenda) / (291) 4276253 (Manuel) · Base Bahía Blanca (Galpón 750 m²)
      </td>
    </tr>
  </table>
</body>
</html>`;

  const clientHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Confirmación de Solicitud ${ref} — Expreso 38 SRL</title>
</head>
<body style="margin:0;padding:24px;background-color:#0b0e11;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background-color:#15191e;border:1px solid #2b313a;border-radius:6px;overflow:hidden;">
    <tr>
      <td style="background-color:#d71932;padding:18px 24px;color:#ffffff;">
        <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;opacity:0.9;">Comprobante de Solicitud B2B</div>
        <div style="font-size:22px;font-weight:800;margin-top:4px;">TRANSPORTE EXPRESO 38 S.R.L.</div>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <p style="margin:0 0 12px;font-size:15px;color:#ffffff;">Estimado/a <strong>${contacto}</strong> (${empresa}),</p>
        <p style="margin:0 0 18px;font-size:14px;color:#cbd5e1;line-height:1.6;">
          Hemos recibido su solicitud de cotización en nuestra Mesa Comercial y de Tráfico. Nuestro equipo operativo ya está evaluando disponibilidad de flota Volvo FH para su ruta.
        </p>

        <div style="background:#101317;border-left:4px solid #d71932;padding:14px 16px;margin-bottom:18px;border-radius:4px;">
          <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Código de Seguimiento</div>
          <div style="font-size:20px;font-weight:800;color:#ffffff;margin-top:2px;">${ref}</div>
          <div style="font-size:12px;color:#cbd5e1;margin-top:4px;">SLA Operativo Estimado: ${sla}</div>
        </div>

        <table width="100%" cellpadding="7" cellspacing="0" style="border-collapse:collapse;font-size:13px;background:#101317;border:1px solid #262c36;border-radius:4px;">
          <tr style="border-bottom:1px solid #222831;">
            <td style="color:#94a3b8;width:36%;">Ruta Solicitada:</td>
            <td style="color:#ffffff;font-weight:600;">${origen} → ${destino}</td>
          </tr>
          <tr style="border-bottom:1px solid #222831;">
            <td style="color:#94a3b8;">Corredor Troncal:</td>
            <td style="color:#cbd5e1;">${corredor} (~${distancia} km)</td>
          </tr>
          <tr style="border-bottom:1px solid #222831;">
            <td style="color:#94a3b8;">Equipo / Peso:</td>
            <td style="color:#ffffff;">${carga} (${peso} Tn)</td>
          </tr>
          <tr>
            <td style="color:#94a3b8;">Fecha Estimada:</td>
            <td style="color:#ffffff;">${fecha}</td>
          </tr>
        </table>

        <p style="margin:18px 0 0;font-size:13px;color:#94a3b8;line-height:1.5;">
          Horario de atención administrativa: <strong>Lunes a Viernes de 9:00 am a 17:00 pm</strong>.<br />
          Administración: <strong>(280) 4873742 (Brenda)</strong> · <strong>(291) 4276253 (Manuel)</strong> · Correo: <a href="mailto:comercial@expreso38.com" style="color:#ff6b7b;">comercial@expreso38.com</a>.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 24px;background-color:#0f1216;border-top:1px solid #222831;font-size:12px;color:#64748b;text-align:center;">
        TRANSPORTE EXPRESO 38 S.R.L. · Base Operativa Bahía Blanca (750 m² · Seguridad 24 hs) · <a href="https://www.instagram.com/expreso_38_srl/" style="color:#94a3b8;">@expreso_38_srl</a>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { adminHtml, clientHtml };
}

/**
 * Envía las notificaciones por correo mediante Nodemailer (si SMTP está configurado)
 * y guarda copia auditable en data/outbox/ para verificación inmediata.
 */
async function sendQuoteNotifications(quote, whatsappUrl) {
  const smtp = getSmtpConfig();
  const { adminHtml, clientHtml } = buildQuoteEmailTemplates(quote, whatsappUrl);

  ensureOutboxDir();
  const safeCode = String(quote.codigo_referencia).replace(/[^a-zA-Z0-9_-]/g, '');
  const previewPath = path.join(OUTBOX_DIR, `${safeCode}-comercial.html`);
  fs.writeFileSync(previewPath, adminHtml, 'utf8');

  if (!smtp.isConfigured) {
    return {
      sent: false,
      mode: 'outbox_preview',
      previewFile: `data/outbox/${safeCode}-comercial.html`,
      message:
        'Previsualización de correo generada en data/outbox/. Configure SMTP_HOST, SMTP_USER y SMTP_PASS en .env para despacho SMTP real.'
    };
  }

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass
      }
    });

    // 1. Correo a Mesa Comercial de Expreso 38 SRL
    await transporter.sendMail({
      from: smtp.from,
      to: smtp.notifyEmail,
      replyTo: quote.email,
      subject: `[Nueva Cotización ${quote.codigo_referencia}] ${quote.empresa} — ${quote.localidad_origen} a ${quote.localidad_destino}`,
      html: adminHtml
    });

    // 2. Correo de acuse de recibo al cliente B2B
    await transporter.sendMail({
      from: smtp.from,
      to: quote.email,
      subject: `Confirmación de Solicitud ${quote.codigo_referencia} — Transporte Expreso 38 SRL`,
      html: clientHtml
    });

    return {
      sent: true,
      mode: 'smtp_nodemailer',
      previewFile: `data/outbox/${safeCode}-comercial.html`
    };
  } catch (err) {
    console.warn('[Mailer] Error enviando correo SMTP:', err.message);
    return {
      sent: false,
      mode: 'smtp_error_saved_outbox',
      error: err.message,
      previewFile: `data/outbox/${safeCode}-comercial.html`
    };
  }
}

module.exports = {
  getSmtpConfig,
  sendQuoteNotifications
};

