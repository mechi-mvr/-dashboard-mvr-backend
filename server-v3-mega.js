const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar módulos
const MetaAdsAPI = require('./meta-ads-api');
const AnalizadorInteligente = require('./analizador-inteligente');
const ClaudeInteligencia = require('./claude-inteligencia');
const SistemaAlertas = require('./sistema-alertas');
const configClientes = require('./config-clientes');

const app = express();
app.use(cors());
app.use(express.json());

// Config
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Instancias
const metaAPI = new MetaAdsAPI(META_ACCESS_TOKEN);
const claudeIA = CLAUDE_API_KEY ? new ClaudeInteligencia(CLAUDE_API_KEY) : null;
const sistemaAlertas = new SistemaAlertas();

// Data en memoria
const tiendaNubeData = {
  pijameria: {
    visitas: 1650,
    ventas: 36,
    facturacion: 4556552,
    aov: 126570.89,
    conversion: 2.18,
    fecha_actualizado: new Date()
  },
  al_capone: {
    visitas: 0,
    ventas: 0,
    facturacion: 0,
    aov: 0,
    conversion: 0,
    fecha_actualizado: new Date()
  }
};

/**
 * Endpoint MEGA: Dashboard completo con TODO
 */
app.get('/api/dashboard-completo/:cliente', async (req, res) => {
  try {
    const cliente = req.params.cliente.toLowerCase();
    const configCliente = configClientes.obtenerCliente(cliente);

    // 1. Obtener datos de Meta
    const insights = await metaAPI.getAccountInsights(configCliente.metaAds.adAccountId);
    const metaData = metaAPI.processInsights(insights);

    // 2. Calcular KPIs
    const kpis = {
      roas: parseFloat(metaData.roas),
      cpc: parseFloat(metaData.cpc),
      conversion: tiendaNubeData[cliente].conversion,
      aov: tiendaNubeData[cliente].aov,
      margin: configCliente.metas.margin || 40,
      spend: metaData.spend,
      revenue: metaData.revenue,
      conversions: metaData.conversions,
      impressions: metaData.impressions,
      clicks: metaData.clicks
    };

    // 3. Análisis automático
    const analizador = new AnalizadorInteligente(kpis, configCliente.metas);
    const analisisAutomatico = analizador.analizar();

    // 4. Claude IA (si está disponible)
    let analisisClaudeIA = null;
    if (claudeIA) {
      try {
        analisisClaudeIA = await claudeIA.generarResumenEjecutivo(
          {
            kpis,
            analisis: analisisAutomatico
          },
          configCliente.nombre
        );
      } catch (error) {
        console.warn('⚠️ Claude API no disponible, continuando sin IA');
      }
    }

    // 5. Procesar alertas
    const alertasCriticas = analisisAutomatico.alertas.filter(a => a.severidad === 'crítica');

    // 6. Reporte ejecutivo
    const reporte = metaAPI.generateReport(insights, tiendaNubeData[cliente], configCliente.metas);

    // 7. Respuesta completa
    const respuesta = {
      cliente,
      nombre: configCliente.nombre,
      tipo: configCliente.tipo,
      
      // SECCIÓN 1: KPIs
      kpis,
      
      // SECCIÓN 2: Análisis Automático
      analisisAutomatico: {
        alertas: analisisAutomatico.alertas,
        oportunidades: analisisAutomatico.oportunidades,
        insights: analisisAutomatico.insights,
        recomendaciones: analisisAutomatico.recomendaciones
      },

      // SECCIÓN 3: Análisis Claude IA (si disponible)
      analisisClaudeIA: analisisClaudeIA ? {
        status: analisisClaudeIA.status,
        resumen: analisisClaudeIA.status === 'success' ? analisisClaudeIA.analisis : null,
        tokens: analisisClaudeIA.uso_tokens
      } : null,

      // SECCIÓN 4: Reporte Ejecutivo
      reporte: {
        metaAds: reporte.meta_ads,
        tiendaNube: reporte.tienda_nube,
        topCreativos: reporte.top_creatives,
        campañas: reporte.campaigns_detail
      },

      // SECCIÓN 5: Status de Alertas
      alertasStatus: {
        total: analisisAutomatico.alertas.length,
        criticas: alertasCriticas.length,
        requiereAccion: alertasCriticas.length > 0
      },

      // Timestamp
      timestamp: new Date().toISOString(),
      proximoRefresh: new Date(Date.now() + 3600000).toISOString()
    };

    res.json(respuesta);
  } catch (error) {
    console.error('Error en /api/dashboard-completo:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: Dashboard Lightweght (solo lo esencial, rápido)
 */
app.get('/api/dashboard-light/:cliente', async (req, res) => {
  try {
    const cliente = req.params.cliente.toLowerCase();
    const configCliente = configClientes.obtenerCliente(cliente);

    const insights = await metaAPI.getAccountInsights(configCliente.metaAds.adAccountId);
    const metaData = metaAPI.processInsights(insights);

    res.json({
      cliente,
      nombre: configCliente.nombre,
      kpis: {
        roas: parseFloat(metaData.roas),
        cpc: parseFloat(metaData.cpc),
        conversion: tiendaNubeData[cliente].conversion,
        spend: metaData.spend,
        revenue: metaData.revenue
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: Resumen ejecutivo con Claude (para presentar a clientes)
 */
app.get('/api/resumen-ejecutivo/:cliente', async (req, res) => {
  if (!claudeIA) {
    return res.status(503).json({ error: 'Claude API no configurada' });
  }

  try {
    const cliente = req.params.cliente.toLowerCase();
    const configCliente = configClientes.obtenerCliente(cliente);

    const insights = await metaAPI.getAccountInsights(configCliente.metaAds.adAccountId);
    const metaData = metaAPI.processInsights(insights);

    const kpis = {
      roas: parseFloat(metaData.roas),
      cpc: parseFloat(metaData.cpc),
      conversion: tiendaNubeData[cliente].conversion,
      spend: metaData.spend,
      revenue: metaData.revenue
    };

    const analizador = new AnalizadorInteligente(kpis, configCliente.metas);
    const analisisAutomatico = analizador.analizar();

    const resumenClaudeIA = await claudeIA.generarResumenEjecutivo(
      { kpis, analisis: analisisAutomatico },
      configCliente.nombre
    );

    res.json({
      cliente,
      nombre: configCliente.nombre,
      resumenEjecutivo: resumenClaudeIA.status === 'success' ? resumenClaudeIA.analisis : null,
      error: resumenClaudeIA.status === 'error' ? resumenClaudeIA.error : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: Plan de testing con Claude
 */
app.get('/api/plan-testing/:cliente', async (req, res) => {
  if (!claudeIA) {
    return res.status(503).json({ error: 'Claude API no configurada' });
  }

  try {
    const cliente = req.params.cliente.toLowerCase();
    const configCliente = configClientes.obtenerCliente(cliente);

    const insights = await metaAPI.getAccountInsights(configCliente.metaAds.adAccountId);
    const metaData = metaAPI.processInsights(insights);

    const plan = await claudeIA.generarPlanTesting(
      {
        roas: parseFloat(metaData.roas),
        cpc: parseFloat(metaData.cpc),
        spend: metaData.spend,
        revenue: metaData.revenue
      },
      configCliente.metas,
      metaData.campaigns.slice(0, 5)
    );

    res.json({
      cliente,
      nombre: configCliente.nombre,
      planTesting: plan.status === 'success' ? plan.analisis : null,
      error: plan.status === 'error' ? plan.error : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: Listar todos los clientes con status actual
 */
app.get('/api/clientes', (req, res) => {
  const activos = configClientes.listarClientesActivos();
  const ingresos = configClientes.obtenerIngresosMensuales();

  res.json({
    clientes: activos,
    totalClientes: activos.length,
    ingresosMensuales: ingresos,
    timestamp: new Date().toISOString()
  });
});

/**
 * Endpoint: Validar configuración de un cliente
 */
app.get('/api/validar/:cliente', (req, res) => {
  try {
    const cliente = req.params.cliente.toLowerCase();
    const validacion = configClientes.validarConfiguracion(cliente);
    res.json(validacion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Endpoint: Health check mejorado
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '3.0-MEGA',
    server: 'Dashboard MVR Backend',
    features: {
      metaAds: '✅ Functional',
      analisisAutomatico: '✅ Functional',
      claudeIA: claudeIA ? '✅ Configured' : '⚠️ Not configured',
      alertas: '✅ Ready'
    },
    endpoints: {
      completo: '/api/dashboard-completo/:cliente (TODO)',
      light: '/api/dashboard-light/:cliente (rápido)',
      resumenEjecutivo: '/api/resumen-ejecutivo/:cliente (Claude)',
      planTesting: '/api/plan-testing/:cliente (Claude)',
      clientes: '/api/clientes (lista)',
      validar: '/api/validar/:cliente (check setup)'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Actualizar Tienda Nube
 */
app.post('/api/tienda-nube/:cliente', (req, res) => {
  try {
    const cliente = req.params.cliente.toLowerCase();
    const data = req.body;

    if (!tiendaNubeData[cliente]) {
      return res.status(400).json({ error: 'Cliente no encontrado' });
    }

    tiendaNubeData[cliente] = {
      ...tiendaNubeData[cliente],
      ...data,
      fecha_actualizado: new Date()
    };

    res.json({
      mensaje: `Datos de ${cliente} actualizados`,
      data: tiendaNubeData[cliente]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Iniciar servidor
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Dashboard MVR Backend v3.0-MEGA en puerto ${PORT}`);
  console.log(`\n✅ Meta Ads API: Conectado`);
  console.log(`✅ Análisis Automático: Activo`);
  console.log(`${claudeIA ? '✅' : '⚠️'} Claude IA: ${claudeIA ? 'Configurada' : 'No configurada'}`);
  console.log(`\n📊 Endpoints principales:`);
  console.log(`   GET  /api/dashboard-completo/:cliente  (TODO)`);
  console.log(`   GET  /api/dashboard-light/:cliente     (rápido)`);
  console.log(`   GET  /api/resumen-ejecutivo/:cliente   (Claude)`);
  console.log(`   GET  /api/plan-testing/:cliente        (Claude)`);
  console.log(`   GET  /api/clientes                     (lista)`);
  console.log(`   GET  /api/health                       (status)`);
  console.log(`\n💡 Clientes: pijameria, al_capone, atanor\n`);
});

module.exports = app;
// Dashboard MVR - Version 1.0.0
