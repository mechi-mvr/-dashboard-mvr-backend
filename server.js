const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Config
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_API_VERSION = 'v18.0';
const PIJAMERIA_AD_ACCOUNT = 'act_388544448436153';
const AL_CAPONE_AD_ACCOUNT = 'act_1218427076628869';

// Cache para datos de Meta (actualizar cada hora)
let metaCacheTimestamp = 0;
let metaCacheData = {};
const CACHE_DURATION = 3600000; // 1 hora en ms

// Data de Tienda Nube (CSV procesado)
let tiendaNubeData = {
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
 * Obtener datos de Meta Ads API
 */
async function obtenerDatosMetaAds(adAccountId) {
  try {
    const url = `https://graph.facebook.com/${META_API_VERSION}/${adAccountId}/insights`;
    
    const params = {
      access_token: META_ACCESS_TOKEN,
      fields: 'campaign_id,campaign_name,spend,impressions,clicks,actions,action_values,cpc,ctr,account_id',
      time_range: JSON.stringify({
        since: Math.floor((Date.now() - 30*24*60*60*1000) / 1000),
        until: Math.floor(Date.now() / 1000)
      }),
      date_preset: 'last_30d'
    };

    const response = await axios.get(url, { params });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching Meta Ads:', error.message);
    return [];
  }
}

/**
 * Procesar datos de Meta y calcular KPIs
 */
function procesarDatosMetaAds(campanas) {
  let totales = {
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    campaigns: []
  };

  campanas.forEach(camp => {
    const spend = parseFloat(camp.spend) || 0;
    const clicks = parseInt(camp.clicks) || 0;
    const impressions = parseInt(camp.impressions) || 0;
    const conversions = camp.actions ? camp.actions.reduce((sum, a) => sum + (a.action_type === 'purchase' ? a.value : 0), 0) : 0;
    const revenue = camp.action_values ? camp.action_values.reduce((sum, a) => sum + parseFloat(a.value || 0), 0) : 0;

    totales.spend += spend;
    totales.clicks += clicks;
    totales.impressions += impressions;
    totales.conversions += conversions;
    totales.revenue += revenue;

    if (spend > 0) {
      totales.campaigns.push({
        nombre: camp.campaign_name || 'Unknown',
        spend,
        cpc: clicks > 0 ? (spend / clicks).toFixed(2) : 0,
        roas: spend > 0 ? (revenue / spend).toFixed(2) : 0,
        conversions,
        revenue
      });
    }
  });

  return totales;
}

/**
 * Calcular KPIs finales
 */
function calcularKPIs(metaData, tnData, clienteMeta) {
  const spend = metaData.spend || 0;
  const revenue = metaData.revenue || 0;
  const clicks = metaData.clicks || 0;
  const conversions = metaData.conversions || 0;

  return {
    roas: spend > 0 ? (revenue / spend).toFixed(2) : 0,
    cpc: clicks > 0 ? (spend / clicks).toFixed(2) : 0,
    conversion: tnData.conversion || 0,
    aov: tnData.aov || 0,
    margin: clienteMeta.margin,
    spend: Math.round(spend),
    revenue: Math.round(revenue),
    conversions,
    meta: clienteMeta
  };
}

/**
 * Detectar alertas
 */
function detectarAlertas(kpis, meta) {
  const alertas = [];

  const desvioCpc = ((kpis.cpc - meta.cpc) / meta.cpc) * 100;
  const desvioRoas = ((kpis.roas - meta.roas) / meta.roas) * 100;
  const desvioConversion = ((kpis.conversion - meta.conversion) / meta.conversion) * 100;

  if (desvioRoas < -15) {
    alertas.push({
      nivel: 'rojo',
      msg: `ROAS ${desvioRoas.toFixed(1)}% vs meta. Revisar creativos.`
    });
  }

  if (desvioCpc > 20) {
    alertas.push({
      nivel: 'amarillo',
      msg: `CPC +${desvioCpc.toFixed(1)}% vs meta. Audiencias pueden estar saturadas.`
    });
  }

  if (desvioConversion < -20) {
    alertas.push({
      nivel: 'amarillo',
      msg: `Conversión ${desvioConversion.toFixed(1)}% vs meta. Revisar UX de TN.`
    });
  }

  if (desvioRoas > 20) {
    alertas.push({
      nivel: 'verde',
      msg: `ROAS +${desvioRoas.toFixed(1)}% vs meta. ¡Excelente!`
    });
  }

  return alertas;
}

/**
 * Endpoint: Obtener dashboard data
 */
app.get('/api/dashboard/:cliente', async (req, res) => {
  try {
    const cliente = req.params.cliente.toLowerCase();
    
    let adAccountId, tnData, meta;
    
    if (cliente === 'pijameria') {
      adAccountId = PIJAMERIA_AD_ACCOUNT;
      tnData = tiendaNubeData.pijameria;
      meta = clienteMetas.pijameria;
    } else if (cliente === 'al_capone') {
      adAccountId = AL_CAPONE_AD_ACCOUNT;
      tnData = tiendaNubeData.al_capone;
      meta = clienteMetas.al_capone;
    } else {
      return res.status(400).json({ error: 'Cliente no encontrado' });
    }

    // Obtener datos de Meta (con caché)
    let metaData;
    if (Date.now() - metaCacheTimestamp > CACHE_DURATION) {
      const campanas = await obtenerDatosMetaAds(adAccountId);
      metaData = procesarDatosMetaAds(campanas);
      metaCacheData[cliente] = metaData;
      metaCacheTimestamp = Date.now();
    } else {
      metaData = metaCacheData[cliente] || {};
    }

    // Calcular KPIs
    const kpis = calcularKPIs(metaData, tnData, meta);
    
    // Detectar alertas
    const alertas = detectarAlertas(kpis, meta);

    res.json({
      cliente,
      tipo: cliente === 'pijameria' ? 'B2C' : 'B2C',
      kpis,
      alertas,
      metaData: {
        campaigns: (metaData.campaigns || []).slice(0, 10),
        totalSpend: Math.round(metaData.spend || 0),
        totalRevenue: Math.round(metaData.revenue || 0)
      },
      tiendaNubeData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en /api/dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Endpoint: Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    clientes: ['pijameria', 'al_capone']
  });
});

/**
 * Endpoint: Actualizar datos de Tienda Nube manualmente
 */
app.post('/api/tienda-nube/:cliente', express.json(), (req, res) => {
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
});

/**
 * Iniciar servidor
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Dashboard MVR Backend corriendo en puerto ${PORT}`);
  console.log(`📊 GET /api/dashboard/pijameria`);
  console.log(`📊 GET /api/dashboard/al_capone`);
  console.log(`💚 GET /api/health`);
});

module.exports = app;
