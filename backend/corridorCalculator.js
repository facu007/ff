/**
 * Calculadora logística de corredor vial, kilometraje referencial y SLA
 * según provincia de origen y región/país de destino.
 */

const ROUTE_RULES = {
  ARG_PAT: {
    corredor: 'Corredor 5 · Troncal Atlántico, Patagonia & Tierra del Fuego (RN 3 / RN 22 / RN 40)',
    baseKm: 1680,
    sla: '24 a 72 hs · Salidas continuas desde Base Bahía Blanca (750 m²)'
  },
  ARG_BUE: {
    corredor: 'Corredor 5 / 1 · Retorno Patagónico & Tierra del Fuego → Buenos Aires / Bahía Blanca (RN 3)',
    baseKm: 980,
    sla: '24 hs · Frecuencia continua Ida y Vuelta'
  },
  ARG_CBA: {
    corredor: 'Corredor 1 · Industrial Centro AMBA – Rosario – Córdoba (RN 9)',
    baseKm: 710,
    sla: '24 hs · Abastecimiento industrial diario'
  },
  ARG_NOA: {
    corredor: 'Corredor 4 · Norte Argentino NOA / NEA & Cuyo (RN 9 / RN 34 / RN 40)',
    baseKm: 1290,
    sla: '36 a 48 hs · Cobertura federal'
  },
  CHL: {
    corredor: 'Corredor 2 · Bioceánico Cuyo & Chile — Paso Cristo Redentor / Cardenal Samoré (RN 7)',
    baseKm: 1420,
    sla: '48 a 72 hs · Gestión Aduanera MIC/DTA'
  },
  BRA: {
    corredor: 'Corredor 3 · Mercosur Este — Paso de los Libres / Uruguaiana (RN 14 / BR-290)',
    baseKm: 1340,
    sla: '48 a 72 hs · Aduana Integrada Mercosur'
  },
  URY: {
    corredor: 'Corredor 3 · Río de la Plata — Colón / Fray Bentos – Montevideo (RN 14 / RN 136)',
    baseKm: 620,
    sla: '24 a 48 hs · Tránsito Internacional MIC/DTA'
  },
  BOL: {
    corredor: 'Corredor 4 · Frontera Norte — Salta / Pocitos / Yacuiba (RN 34)',
    baseKm: 1650,
    sla: '48 a 72 hs · Habilitación Internacional ATIT'
  },
  PRY: {
    corredor: 'Corredor 4 · Hidrovía & NEA — Clorinda / Asunción (RN 11)',
    baseKm: 1240,
    sla: '48 a 72 hs · Habilitación Internacional ATIT'
  }
};

const ORIGIN_MODIFIERS = {
  'Chubut': 260,
  'Santa Cruz': 680,
  'Tierra del Fuego': 1150,
  'Neuquén': 180,
  'Río Negro': 160,
  'Buenos Aires': 0,
  'Santa Fe': -80,
  'Córdoba': 40,
  'Mendoza': 150,
  'Otra Provincia': 220
};

function estimateLogisticsRoute({ provinciaOrigen, destinoRegion }) {
  const rule = ROUTE_RULES[destinoRegion] || {
    corredor: 'Red Troncal Integrada Expreso 38 SRL',
    baseKm: 1100,
    sla: '24 a 72 hs · Monitoreo GPS 24/7'
  };

  // Si origen y destino están ambos en Patagonia (ej. Chubut -> ARG_PAT), ajustamos a tramo regional patagónico
  if (
    destinoRegion === 'ARG_PAT' &&
    ['Chubut', 'Neuquén', 'Santa Cruz'].includes(provinciaOrigen)
  ) {
    return {
      corredor: 'Corredor 5 & 6 · Intrapatagónico & Cuenca Neuquina (RN 3 / RN 22 / RN 40)',
      distanciaKm: provinciaOrigen === 'Santa Cruz' ? 780 : 540,
      sla: '12 a 24 hs · Operación regional directa'
    };
  }

  const delta = ORIGIN_MODIFIERS[provinciaOrigen] || 0;
  const distanciaKm = Math.max(250, rule.baseKm + delta);

  return {
    corredor: rule.corredor,
    distanciaKm,
    sla: rule.sla
  };
}

module.exports = { estimateLogisticsRoute };

