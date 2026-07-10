const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar módulos custom
const MetaAdsAPI = require('./meta-ads-api');
const AnalizadorInteligente = require('./analizador-inteligente');

const app = express();
app.use(cors());
app.use(express.json());

// Configuración
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const PIJAMERIA_AD_ACCOUNT = 'act_388544448436153';
const AL_CAPONE_AD_ACCOUNT = 'act_1218427076628869';

// Instanciar Meta Ads API
const metaAPI = new MetaAdsAPI(META_ACCESS_TOKEN);

// Data de Tienda Nube (placeholder - se actualiza vía POST)
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

// Metas por cliente
const clienteMetas = {
  pijameria: {
    roas: 10,
    cpc: 90,
    conversion: 2.5,
    aov: 126571,
    margin: 38
  },
  al_capone: {
    roas: 8,
    cpc: 120,
    conversion: 3.2,
    aov: 3500,
    margin: 40
  }
};

/**
 * Obtener datos del cliente y hacer análisis
 */
async function obtenerDatosCliente(cliente, adAccountId) {
  try {
    // Obtener insights de Meta
    const insights = await metaAPI.getAccountInsights(adAccountId, 'last_30d');
    const metaData = metaAPI.processInsights(insights);

    // Calcular KPIs
    const kpis = {
      roas: parseFloat(metaData.roas),
      cpc: parseFloat(metaData.cpc),
      conversion: tiendaNubeData[cliente].conversion,
      aov: tiendaNubeData[cliente].aov,
      margin: clienteMetas[cliente].margin,
      spend: metaData.spend,
      revenue: metaData.revenue,
      conversions: metaData.conversions,
      impressions: metaData.impressions,
      clicks: metaData.clicks
    };

    // Análisis inteligente
    const analizador = new AnalizadorInteligente(kpis, clienteMetas[cliente]);
    const analisis = analizador.analizar();

    // Generar reporte
    const reporte = metaAPI.generateReport(insights, tiendaNubeData[cliente], clienteMetas[cliente]);

    return {
      cliente,
      tipo: cliente === 'pijameria' ? 'B2C Ecommerce' : 'B2C Ecommerce',
      kpis,
      analisis,
      reporte,
      metaData: {
        campaigns: metaData.campaigns.slice(0, 10),
        totalSpend: metaData.spend,
        totalRevenue: metaData.revenue,
        totalImpressions: metaData.impressions,
        totalClicks: metaData.clicks
      },
      tiendaNubeData: tiendaNubeData[cliente],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error en obtenerDatosCliente (${cliente}):`, error);
    return null;
  }
}

/**
 * Endpoint: Dashboard completo
 */
app.get('/api/dashboard/:cliente', async (req, res) => {
  try {
    const cliente = req.params.cliente.toLowerCase();
    let adAccountId, meta;

    if (cliente === 'pijameria') {
      adAccountId = PIJAMERIA_AD_ACCOUNT;
      meta = clienteMetas.pijameria;
    } else if (cliente === 'al_capone') {
      adAccountId = AL_CAPONE_AD_ACCOUNT;
      meta = clienteMetas.al_capone;
    } else {
      return res.status(400).json({ error: 'Cliente no encontrado. Use: pijameria o al_capone' });
    }

    const datos = await obtenerDatosCliente(cliente, adAccountId);
    
    if (!datos) {
      return res.status(500).json({ error: 'Error al obtener datos' });
    }

    res.json(datos);
  } catch (error) {
    console.error('Error en /api/dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: Solo KPIs (más rápido)
 */
app.get('/api/kpis/:cliente', async (req, res) => {
  try {
    const cliente = req.params.cliente.toLowerCase();
    let adAccountId;

    if (cliente === 'pijameria') {
      adAccountId = PIJAMERIA_AD_ACCOUNT;
    } else if (cliente === 'al_capone') {
      adAccountId = AL_CAPONE_AD_ACCOUNT;
    } else {
      return res.status(400).json({ error: 'Cliente no encontrado' });
    }

    const insights = await metaAPI.getAccountInsights(adAccountId);
    const metaData = metaAPI.processInsights(insights);

    res.json({
      cliente,
      kpis: {
        roas: parseFloat(metaData.roas),
        cpc: parseFloat(metaData.cpc),
        conversion: tiendaNubeData[cliente].conversion,
        aov: tiendaNubeData[cliente].aov,
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
 * Endpoint: Análisis detallado
 */
app.get('/api/analisis/:cliente', async (req, res) => {
  try {
    const cliente = req.params.cliente.toLowerCase();
    let adAccountId;

    if (cliente === 'pijameria') {
      adAccountId = PIJAMERIA_AD_ACCOUNT;
    } else if (cliente === 'al_capone') {
      adAccountId = AL_CAPONE_AD_ACCOUNT;
    } else {
      return res.status(400).json({ error: 'Cliente no encontrado' });
    }

    const datos = await obtenerDatosCliente(cliente, adAccountId);
    
    res.json({
      cliente,
      alertas: datos.analisis.alertas,
      oportunidades: datos.analisis.oportunidades,
      insights: datos.analisis.insights,
      recomendaciones: datos.analisis.recomendaciones,
      timestamp: datos.timestamp
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: Campañas detalladas
 */
app.get('/api/campañas/:cliente', async (req, res) => {
  try {
    const cliente = req.params.cliente.toLowerCase();
    let adAccountId;

    if (cliente === 'pijameria') {
      adAccountId = PIJAMERIA_AD_ACCOUNT;
    } else if (cliente === 'al_capone') {
      adAccountId = AL_CAPONE_AD_ACCOUNT;
    } else {
      return res.status(400).json({ error: 'Cliente no encontrado' });
    }

    const insights = await metaAPI.getAccountInsights(adAccountId);
    const metaData = metaAPI.processInsights(insights);
    const topCreatives = metaAPI.identifyTopCreatives(insights, 10);

    res.json({
      cliente,
      campañas: metaData.campaigns.slice(0, 15),
      top_creativos: topCreatives,
      total: {
        spend: metaData.spend,
        revenue: metaData.revenue,
        roas: metaData.roas
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: Actualizar datos Tienda Nube
 */
app.post('/api/tienda-nube/:cliente', express.json(), (req, res) => {
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
      mensaje: `Datos de ${cliente} actualizados exitosamente`,
      data: tiendaNubeData[cliente]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Dashboard MVR Backend is running',
    version: '2.0',
    endpoints: [
      'GET /api/dashboard/:cliente',
      'GET /api/kpis/:cliente',
      'GET /api/analisis/:cliente',
      'GET /api/campañas/:cliente',
      'POST /api/tienda-nube/:cliente',
      'GET /api/health'
    ],
    clientes: ['pijameria', 'al_capone'],
    timestamp: new Date().toISOString()
  });
});

/**
 * Endpoint: Comparativa entre clientes
 */
app.get('/api/comparativa', async (req, res) => {
  try {
    const pijameria = await obtenerDatosCliente('pijameria', PIJAMERIA_AD_ACCOUNT);
    const alCapone = await obtenerDatosCliente('al_capone', AL_CAPONE_AD_ACCOUNT);

    res.json({
      pijameria: {
        roas: pijameria.kpis.roas,
        cpc: pijameria.kpis.cpc,
        spend: pijameria.kpis.spend,
        revenue: pijameria.kpis.revenue
      },
      al_capone: {
        roas: alCapone.kpis.roas,
        cpc: alCapone.kpis.cpc,
        spend: alCapone.kpis.spend,
        revenue: alCapone.kpis.revenue
      },
      timestamp: new Date().toISOString()
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
  console.log(`\n✅ Dashboard MVR Backend v2.0 corriendo en puerto ${PORT}`);
  console.log(`\n📊 Endpoints disponibles:`);
  console.log(`   GET  /api/dashboard/:cliente      (todo incluido)`);
  console.log(`   GET  /api/kpis/:cliente           (solo métricas)`);
  console.log(`   GET  /api/analisis/:cliente       (análisis inteligente)`);
  console.log(`   GET  /api/campañas/:cliente       (creativos top)`);
  console.log(`   POST /api/tienda-nube/:cliente    (actualizar TN)`);
  console.log(`   GET  /api/comparativa             (entre clientes)`);
  console.log(`   GET  /api/health                  (verificar salud)\n`);
  console.log(`💡 Clientes: pijameria, al_capone\n`);
});

module.exports = app;
