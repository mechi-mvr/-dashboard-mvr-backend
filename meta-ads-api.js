const axios = require('axios');

class MetaAdsAPI {
  constructor(accessToken, apiVersion = 'v18.0') {
    this.accessToken = accessToken;
    this.apiVersion = apiVersion;
    this.baseUrl = `https://graph.facebook.com/${apiVersion}`;
    this.cache = {};
    this.cacheExpiry = 3600000; // 1 hora
  }

  /**
   * Obtener insights de una ad account
   */
  async getAccountInsights(adAccountId, datePreset = 'last_30d') {
    const cacheKey = `insights_${adAccountId}`;
    
    // Verificar caché
    if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].timestamp < this.cacheExpiry) {
      return this.cache[cacheKey].data;
    }

    try {
      const url = `${this.baseUrl}/${adAccountId}/insights`;
      
      const response = await axios.get(url, {
        params: {
          access_token: this.accessToken,
          fields: [
            'campaign_id',
            'campaign_name',
            'spend',
            'impressions',
            'clicks',
            'actions',
            'action_values',
            'cpc',
            'ctr',
            'account_id',
            'date_start',
            'date_stop'
          ].join(','),
          date_preset: datePreset,
          limit: 100
        }
      });

      const data = response.data.data || [];
      
      // Cachear resultado
      this.cache[cacheKey] = {
        data,
        timestamp: Date.now()
      };

      return data;
    } catch (error) {
      console.error('Error en getAccountInsights:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Obtener datos de campañas activas
   */
  async getActiveCampaigns(adAccountId) {
    try {
      const url = `${this.baseUrl}/${adAccountId}/campaigns`;
      
      const response = await axios.get(url, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,status,objective,daily_budget,lifetime_budget,created_time',
          limit: 100
        }
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Error en getActiveCampaigns:', error.message);
      return [];
    }
  }

  /**
   * Obtener creativos por campaña
   */
  async getCreativesByAdSet(adSetId) {
    try {
      const url = `${this.baseUrl}/${adSetId}/ads`;
      
      const response = await axios.get(url, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,creative,status,created_time'
        }
      });

      return response.data.data || [];
    } catch (error) {
      console.error('Error en getCreativesByAdSet:', error.message);
      return [];
    }
  }

  /**
   * Procesar insights y calcular métricas agregadas
   */
  processInsights(insights) {
    if (!Array.isArray(insights) || insights.length === 0) {
      return {
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        campaigns: [],
        cpc: 0,
        ctr: 0,
        roas: 0
      };
    }

    const totales = {
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      campaigns: []
    };

    insights.forEach(insight => {
      const spend = parseFloat(insight.spend) || 0;
      const impressions = parseInt(insight.impressions) || 0;
      const clicks = parseInt(insight.clicks) || 0;
      
      // Procesar conversiones (pueden ser múltiples acciones)
      let conversions = 0;
      if (insight.actions && Array.isArray(insight.actions)) {
        conversions = insight.actions
          .filter(a => a.action_type === 'purchase')
          .reduce((sum, a) => sum + parseInt(a.value || 0), 0);
      }

      // Procesar revenue (valores de acciones)
      let revenue = 0;
      if (insight.action_values && Array.isArray(insight.action_values)) {
        revenue = insight.action_values
          .filter(a => a.action_type === 'purchase')
          .reduce((sum, a) => sum + parseFloat(a.value || 0), 0);
      }

      totales.spend += spend;
      totales.impressions += impressions;
      totales.clicks += clicks;
      totales.conversions += conversions;
      totales.revenue += revenue;

      // Agregar campaña individual si tiene spend
      if (spend > 0) {
        totales.campaigns.push({
          id: insight.campaign_id,
          nombre: insight.campaign_name || 'Unknown',
          spend: Math.round(spend),
          impressions,
          clicks,
          conversions,
          revenue: Math.round(revenue),
          cpc: clicks > 0 ? (spend / clicks).toFixed(2) : 0,
          ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : 0,
          roas: spend > 0 ? (revenue / spend).toFixed(2) : 0
        });
      }
    });

    // Calcular totales
    const processed = {
      ...totales,
      spend: Math.round(totales.spend),
      revenue: Math.round(totales.revenue),
      cpc: totales.clicks > 0 ? (totales.spend / totales.clicks).toFixed(2) : 0,
      ctr: totales.impressions > 0 ? ((totales.clicks / totales.impressions) * 100).toFixed(2) : 0,
      roas: totales.spend > 0 ? (totales.revenue / totales.spend).toFixed(2) : 0,
      campaigns: totales.campaigns.sort((a, b) => b.revenue - a.revenue)
    };

    return processed;
  }

  /**
   * Detectar tendencias (comparar períodos)
   */
  detectTrendencias(actuales, periodo_anterior) {
    const cambios = {
      spend: this.calcularCambio(actuales.spend, periodo_anterior.spend),
      revenue: this.calcularCambio(actuales.revenue, periodo_anterior.revenue),
      roas: this.calcularCambio(parseFloat(actuales.roas), parseFloat(periodo_anterior.roas)),
      cpc: this.calcularCambio(parseFloat(actuales.cpc), parseFloat(periodo_anterior.cpc))
    };

    return cambios;
  }

  /**
   * Calcular cambio porcentual
   */
  calcularCambio(actual, anterior) {
    if (anterior === 0) return 0;
    return (((actual - anterior) / anterior) * 100).toFixed(1);
  }

  /**
   * Identificar creativos de mejor performance
   */
  identifyTopCreatives(insights, topN = 5) {
    return insights
      .filter(i => parseFloat(i.spend) > 0)
      .sort((a, b) => {
        const roasA = parseFloat(a.action_values?.[0]?.value || 0) / parseFloat(a.spend);
        const roasB = parseFloat(b.action_values?.[0]?.value || 0) / parseFloat(b.spend);
        return roasB - roasA;
      })
      .slice(0, topN)
      .map(i => ({
        campaign: i.campaign_name,
        spend: Math.round(parseFloat(i.spend)),
        roas: (parseFloat(i.action_values?.[0]?.value || 0) / parseFloat(i.spend)).toFixed(2),
        conversions: i.actions?.filter(a => a.action_type === 'purchase')[0]?.value || 0
      }));
  }

  /**
   * Generar reporte ejecutivo
   */
  generateReport(insights, tiendaNubeData, metas) {
    const processed = this.processInsights(insights);
    
    const report = {
      resumen: {
        periodo: 'Últimos 30 días',
        fecha_generado: new Date().toISOString()
      },
      meta_ads: {
        spend: processed.spend,
        revenue: processed.revenue,
        roas: processed.roas,
        cpc: processed.cpc,
        conversiones: processed.conversions,
        impresiones: processed.impressions,
        clicks: processed.clicks
      },
      tienda_nube: tiendaNubeData,
      comparacion_metas: {
        roas: {
          actual: parseFloat(processed.roas),
          meta: metas.roas,
          desvio: (((parseFloat(processed.roas) - metas.roas) / metas.roas) * 100).toFixed(1)
        },
        cpc: {
          actual: parseFloat(processed.cpc),
          meta: metas.cpc,
          desvio: (((parseFloat(processed.cpc) - metas.cpc) / metas.cpc) * 100).toFixed(1)
        }
      },
      top_creatives: this.identifyTopCreatives(insights, 5),
      campaigns_detail: processed.campaigns.slice(0, 10)
    };

    return report;
  }

  /**
   * Limpiar caché manualmente
   */
  clearCache() {
    this.cache = {};
  }
}

module.exports = MetaAdsAPI;
