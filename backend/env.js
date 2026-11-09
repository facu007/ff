const fs = require('fs');
const path = require('path');

/**
 * Carga variables de entorno desde .env sin requerir dependencias externas,
 * o utiliza dotenv si se encuentra instalado.
 */
function loadEnv() {
  try {
    require('dotenv').config();
    return;
  } catch (_) {
    // Fallback nativo si aún no se ejecutó npm install
  }

  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

module.exports = { loadEnv };

