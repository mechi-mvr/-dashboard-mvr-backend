/**
 * EJEMPLOS DE USO - Dashboard MVR Backend
 * Cómo usar los módulos principales
 */

// ============================================
// 1. USAR MetaAdsAPI
// ============================================

const MetaAdsAPI = require('./meta-ads-api');

async function ejemploMetaAdsAPI() {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const metaAPI = new MetaAdsAPI(accessToken);

  const adAccountId = 'act_388544448436153';

  // Obtener insights de los últimos 30 días
  const insights = await metaAPI.getAccountInsights(adAccountId, 'last_30d');
  console.log('Insights obtenidos:', insights.length);

  // Procesar y calcular KPIs
  const processed = metaAPI.processInsights(insights);
  console.log(`ROAS: ${processed.roas}x`);
  console.log(`CPC: $${processed.cpc}`);
  console.log(`Revenue: $${processed.revenue}`);

  // Identificar creativos top
  const topCreatives = metaAPI.identifyTopCreatives(insights, 5);
  console.log('Top 5 creativos:', topCreatives);

  // Generar reporte completo
  const metas = { roas: 10, cpc: 90 };
  const tiendaNubeData = { conversion: 2.5, aov: 126571 };
  const report = metaAPI.generateReport(insights, tiendaNubeData, metas);
  console.log('Reporte generado:', report);
}

// ============================================
// 2. USAR AnalizadorInteligente
// ============================================

const AnalizadorInteligente = require('./analizador-inteligente');

function ejemploAnalizador() {
  // KPIs actuales
  const kpis = {
    roas: 8.2,
    cpc: 110,
    conversion: 1.8,
    aov: 130000,
    margin: 38,
    spend: 10000,
    revenue: 82000
  };

  // Metas
  const metas = {
    roas: 10,
    cpc: 90,
    conversion: 2.5,
    aov: 126571,
    margin: 38
  };

  // Datos históricos (opcional)
  const datosHistoricos = {
    roas_anterior: 9.1,
    conversion_anterior: 2.1
  };

  // Crear analizador
  const analizador = new AnalizadorInteligente(kpis, metas, datosHistoricos);
  const analisis = analizador.analizar();

  console.log('ALERTAS:');
  analisis.alertas.forEach(alerta => {
    console.log(`[${alerta.nivel}] ${alerta.tipo}: ${alerta.causa_probable}`);
    console.log(`  Acciones: ${alerta.acciones.join(', ')}`);
  });

  console.log('\nOPORTUNIDADES:');
  analisis.oportunidades.forEach(oportunidad => {
    console.log(`[${oportunidad.tipo}] ${oportunidad.descripcion}`);
  });

  console.log('\nRECOMENDACIONES:');
  analisis.recomendaciones.forEach(rec => {
    console.log(`Prioridad ${rec.prioridad}: ${rec.titulo}`);
  });
}

// ============================================
// 3. USAR ClaudeInteligencia
// ============================================

const ClaudeInteligencia = require('./claude-inteligencia');

async function ejemploClaudeInteligencia() {
  const claudeAPI = new ClaudeInteligencia(process.env.CLAUDE_API_KEY);

  // Ejemplo 1: Análisis profundo
  const kpis = {
    roas: 8.2,
    cpc: 110,
    conversion: 1.8,
    aov: 130000,
    spend: 10000,
    revenue: 82000
  };

  const alertas = [
    { tipo: 'ROAS', causa_probable: 'Creativos con fatiga' },
    { tipo: 'CPC', causa_probable: 'Audiencias saturadas' }
  ];

  const oportunidades = [
    { tipo: 'UPSELL', descripcion: 'AOV bajo - implementar bundles' }
  ];

  const campañas = [
    { nombre: 'BROAD | Mujeres', spend: 5000, roas: 8.5 }
  ];

  const analisis = await claudeAPI.analizarDatosMarketing(
    kpis,
    alertas,
    oportunidades,
    campañas
  );

  console.log('Análisis de Claude:');
  console.log(analisis.analisis);

  // Ejemplo 2: Generar resumen ejecutivo
  const datosCliente = {
    kpis,
    analisis: {
      alertas,
      oportunidades
    }
  };

  const resumen = await claudeAPI.generarResumenEjecutivo(
    datosCliente,
    'Pijamería'
  );

  console.log('\nResumen Ejecutivo:');
  console.log(resumen.analisis);

  // Ejemplo 3: Plan de testing
  const metas = { roas: 10, cpc: 90 };
  const plan = await claudeAPI.generarPlanTesting(
    kpis,
    metas,
    campañas
  );

  console.log('\nPlan de Testing:');
  console.log(plan.analisis);
}

// ============================================
// 4. USAR SistemaAlertas
// ============================================

const SistemaAlertas = require('./sistema-alertas');

async function ejemploSistemaAlertas() {
  // Configurar sistema de alertas
  const alertas = new SistemaAlertas();

  // Configurar email (Gmail + App Password)
  alertas.configurarEmail(
    {
      service: 'gmail',
      auth: {
        user: 'tu-email@gmail.com',
        pass: 'tu-app-password' // No es tu contraseña normal!
      }
    },
    'tu-email@gmail.com',
    'mechi@comunicaconsentido.com'
  );

  // Configurar Slack
  alertas.configurarSlack(
    'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
    '#alertas-marketing'
  );

  // Agregar webhooks customizados
  alertas.agregarWebhook('https://tu-api.com/webhooks/alertas');

  // Procesar alertas
  const alertasDetectadas = [
    {
      nivel: 'rojo',
      tipo: 'ROAS',
      desvio: '-25.5',
      actual: 7.5,
      meta: 10,
      severidad: 'crítica',
      causa_probable: 'Creativos con fatiga',
      acciones: [
        'Pausar creativos con bajo ROAS',
        'Lanzar nuevos creativos'
      ]
    }
  ];

  const kpis = {
    roas: 7.5,
    cpc: 120,
    conversion: 1.8,
    spend: 10000,
    revenue: 75000
  };

  const resultado = await alertas.procesarAlertas(
    'pijameria',
    alertasDetectadas,
    kpis,
    { visitas: 1000, ventas: 20 }
  );

  console.log('Alertas procesadas:', resultado);
  console.log('Email enviado:', resultado.email);
  console.log('Slack enviado:', resultado.slack);

  // Ver histórico
  const historico = alertas.obtenerHistorico('pijameria');
  console.log('Histórico de alertas:', historico);
}

// ============================================
// 5. USAR ConfigClientes
// ============================================

const { 
  obtenerCliente, 
  obtenerMetasCliente,
  listarClientesActivos,
  obtenerIngresosMensuales,
  validarConfiguracion
} = require('./config-clientes');

function ejemploConfigClientes() {
  // Obtener configuración de un cliente
  const pijameria = obtenerCliente('pijameria');
  console.log(`Cliente: ${pijameria.nombre}`);
  console.log(`Tipo: ${pijameria.tipo}`);
  console.log(`Email: ${pijameria.contactos.email}`);

  // Obtener solo las metas
  const metas = obtenerMetasCliente('pijameria');
  console.log('Metas:', metas);

  // Listar clientes activos
  const activos = listarClientesActivos();
  console.log('Clientes activos:', activos);

  // Obtener ingresos mensuales totales
  const ingresos = obtenerIngresosMensuales();
  console.log(`Ingresos mensuales: $${ingresos}`);

  // Validar configuración
  const validacion = validarConfiguracion('pijameria');
  console.log('Validación:', validacion);
}

// ============================================
// 6. FLUJO COMPLETO
// ============================================

async function flujoCompleto() {
  console.log('=== FLUJO COMPLETO ===\n');

  // 1. Obtener config del cliente
  const configCliente = obtenerCliente('pijameria');
  console.log(`📊 Analizando: ${configCliente.nombre}`);

  // 2. Obtener datos de Meta
  const metaAPI = new MetaAdsAPI(process.env.META_ACCESS_TOKEN);
  const insights = await metaAPI.getAccountInsights(configCliente.metaAds.adAccountId);
  const metaData = metaAPI.processInsights(insights);

  // 3. Hacer análisis automático
  const kpis = {
    roas: parseFloat(metaData.roas),
    cpc: parseFloat(metaData.cpc),
    conversion: 2.5,
    aov: 126571,
    margin: 38,
    spend: metaData.spend,
    revenue: metaData.revenue
  };

  const analizador = new AnalizadorInteligente(kpis, configCliente.metas);
  const analisis = analizador.analizar();

  // 4. Enviar alertas si hay problemas críticos
  const alertasCriticas = analisis.alertas.filter(a => a.severidad === 'crítica');
  if (alertasCriticas.length > 0) {
    const sistemaAlertas = new SistemaAlertas();
    sistemaAlertas.configurarEmail(
      {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      },
      process.env.EMAIL_USER,
      configCliente.contactos.email
    );

    await sistemaAlertas.procesarAlertas(
      'pijameria',
      analisis.alertas,
      kpis,
      { visitas: 1000, ventas: 20 }
    );
  }

  // 5. Generar análisis profundo con Claude (si está disponible)
  if (process.env.CLAUDE_API_KEY) {
    const claude = new ClaudeInteligencia(process.env.CLAUDE_API_KEY);
    const resumen = await claude.generarResumenEjecutivo(
      { kpis, analisis },
      configCliente.nombre
    );
    console.log('\n📝 Resumen ejecutivo de Claude:');
    console.log(resumen.analisis);
  }

  console.log('\n✅ Análisis completado');
}

// ============================================
// EXPORTAR
// ============================================

module.exports = {
  ejemploMetaAdsAPI,
  ejemploAnalizador,
  ejemploClaudeInteligencia,
  ejemploSistemaAlertas,
  ejemploConfigClientes,
  flujoCompleto
};

// Para correr los ejemplos:
// node -e "const ex = require('./ejemplos.js'); ex.flujoCompleto();"
