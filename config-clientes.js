/**
 * Configuración de clientes para Dashboard MVR
 * Define: metas, contactos, Ad Accounts, preferencias
 */

const clientes = {
  pijameria: {
    // Información básica
    nombre: 'Pijamería',
    descripcion: 'Tienda online de pijamas',
    tipo: 'B2C Ecommerce',
    industria: 'Ropa/Fashion',
    url: 'https://www.pijameria.com.ar',
    
    // Meta Ads
    metaAds: {
      adAccountId: 'act_388544448436153',
      businessAccountId: 'fb_business_123'
    },

    // Tienda Nube
    tiendaNube: {
      storeId: 'pijameria',
      apiKey: process.env.TIENDA_NUBE_API_KEY_PIJAMERIA || '',
      pixelId: '191625776945530'
    },

    // KPIs y Metas
    metas: {
      roas: 10,           // 10x (Meta de retorno)
      cpc: 90,            // $90 por click
      conversion: 2.5,    // 2.5% de conversión
      aov: 126571,        // AOV promedio en ARS
      margin: 38          // 38% de margen
    },

    // Contactos para alertas
    contactos: {
      email: 'mechi@pijameria.com.ar',
      slack: 'https://hooks.slack.com/services/...',
      telefono: '+54 9 221 123-4567'
    },

    // Preferencias
    preferencias: {
      frecuenciaReporte: 'diaria',  // diaria, semanal, mensual
      horarioNotificaciones: '09:00-17:00', // En ARS (Argentina)
      alertarPor: ['email', 'slack'],
      umbralAlertaCritica: {
        roasBajo: -20,     // Alerta si ROAS baja 20% vs meta
        cpcAlto: 30,       // Alerta si CPC sube 30% vs meta
        conversionBaja: -25 // Alerta si conversión baja 25% vs meta
      }
    },

    // Histórico
    creacion: '2024-01-15',
    status: 'activo',
    ticketMensual: 500 // USD

  },

  al_capone: {
    // Información básica
    nombre: 'Al Capone Indumentaria',
    descripcion: 'Marca de ropa y accesorios para hombres',
    tipo: 'B2C Ecommerce',
    industria: 'Indumentaria',
    url: 'https://www.alcapone.com.ar',
    
    // Meta Ads
    metaAds: {
      adAccountId: 'act_1218427076628869',
      businessAccountId: 'fb_business_456'
    },

    // Tienda Nube
    tiendaNube: {
      storeId: 'al_capone',
      apiKey: process.env.TIENDA_NUBE_API_KEY_AL_CAPONE || '',
      pixelId: ''
    },

    // KPIs y Metas
    metas: {
      roas: 8,            // 8x
      cpc: 120,           // $120
      conversion: 3.2,    // 3.2%
      aov: 3500,          // AOV en ARS
      margin: 40          // 40%
    },

    // Contactos
    contactos: {
      email: 'marketing@alcapone.com.ar',
      slack: 'https://hooks.slack.com/services/...',
      telefono: '+54 9 221 456-7890'
    },

    // Preferencias
    preferencias: {
      frecuenciaReporte: 'semanal',
      horarioNotificaciones: '08:00-18:00',
      alertarPor: ['email'],
      umbralAlertaCritica: {
        roasBajo: -15,
        cpcAlto: 25,
        conversionBaja: -20
      }
    },

    creacion: '2024-03-20',
    status: 'activo',
    ticketMensual: 300

  },

  atanor: {
    // Información básica
    nombre: 'ATANOR',
    descripcion: 'Empresa B2B de equipamiento industrial',
    tipo: 'B2B Lead Gen',
    industria: 'Industria',
    url: 'https://www.atanor.com.ar',
    
    // Meta Ads
    metaAds: {
      adAccountId: 'act_xxx',
      businessAccountId: 'fb_business_789'
    },

    // Google Ads (para lead gen)
    googleAds: {
      customerId: 'xxx-xxx-xxxx',
      campaignId: 'xxx'
    },

    // KPIs y Metas (diferentes para B2B)
    metas: {
      cpl: 500,           // $500 Cost Per Lead (USD)
      costQualificado: 1500, // Costo por lead calificado
      ctr: 2.5,           // CTR esperado
      conversionForm: 8   // 8% de conversión a formulario
    },

    // Contactos
    contactos: {
      email: 'marketing@atanor.com.ar',
      slack: '',
      telefono: '+54 11 4567-8900'
    },

    // Preferencias
    preferencias: {
      frecuenciaReporte: 'semanal',
      horarioNotificaciones: '09:00-17:00',
      alertarPor: ['email'],
      umbralAlertaCritica: {
        cplAlto: 30,
        ctrBajo: -20
      }
    },

    creacion: '2024-05-10',
    status: 'activo',
    ticketMensual: 1000

  }
};

/**
 * Obtener configuración de un cliente
 */
function obtenerCliente(nombreCliente) {
  const cliente = clientes[nombreCliente.toLowerCase()];
  
  if (!cliente) {
    throw new Error(`Cliente no encontrado: ${nombreCliente}`);
  }

  return cliente;
}

/**
 * Obtener metas de un cliente
 */
function obtenerMetasCliente(nombreCliente) {
  const cliente = obtenerCliente(nombreCliente);
  return cliente.metas;
}

/**
 * Obtener contactos de un cliente
 */
function obtenerContactosCliente(nombreCliente) {
  const cliente = obtenerCliente(nombreCliente);
  return cliente.contactos;
}

/**
 * Actualizar metas de un cliente
 */
function actualizarMetasCliente(nombreCliente, nuvasMetas) {
  const cliente = obtenerCliente(nombreCliente);
  cliente.metas = {
    ...cliente.metas,
    ...nuvasMetas
  };
  return cliente.metas;
}

/**
 * Listar todos los clientes activos
 */
function listarClientesActivos() {
  return Object.entries(clientes)
    .filter(([_, cliente]) => cliente.status === 'activo')
    .map(([key, cliente]) => ({
      key,
      nombre: cliente.nombre,
      tipo: cliente.tipo,
      ticketMensual: cliente.ticketMensual
    }));
}

/**
 * Obtener ingresos totales mensuales
 */
function obtenerIngresosMensuales() {
  return Object.values(clientes)
    .filter(c => c.status === 'activo')
    .reduce((total, cliente) => total + (cliente.ticketMensual || 0), 0);
}

/**
 * Validar que todos los clientes tengan configuración completa
 */
function validarConfiguracion(nombreCliente) {
  const cliente = obtenerCliente(nombreCliente);
  const errores = [];

  // Validar Meta Ads
  if (!cliente.metaAds?.adAccountId) {
    errores.push('❌ Ad Account ID de Meta no configurado');
  }

  // Validar contactos
  if (!cliente.contactos?.email) {
    errores.push('❌ Email de contacto no configurado');
  }

  // Validar metas
  if (!cliente.metas?.roas && !cliente.metas?.cpl) {
    errores.push('❌ Metas no configuradas');
  }

  if (errores.length > 0) {
    return {
      valido: false,
      errores
    };
  }

  return {
    valido: true,
    mensaje: '✅ Configuración completa'
  };
}

module.exports = {
  clientes,
  obtenerCliente,
  obtenerMetasCliente,
  obtenerContactosCliente,
  actualizarMetasCliente,
  listarClientesActivos,
  obtenerIngresosMensuales,
  validarConfiguracion
};
