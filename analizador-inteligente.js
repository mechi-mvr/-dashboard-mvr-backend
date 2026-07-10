/**
 * Módulo de Análisis Inteligente para Dashboard MVR
 * Detecta problemas, oportunidades y genera insights
 * Base para integración con Claude API
 */

class AnalizadorInteligente {
  constructor(kpis, metas, datosHistoricos = {}) {
    this.kpis = kpis;
    this.metas = metas;
    this.datosHistoricos = datosHistoricos;
    this.alertas = [];
    this.oportunidades = [];
    this.insights = [];
  }

  /**
   * Analizar todo y generar reporte
   */
  analizar() {
    this.detectarProblemas();
    this.detectarOportunidades();
    this.generarInsights();

    return {
      alertas: this.alertas,
      oportunidades: this.oportunidades,
      insights: this.insights,
      recomendaciones: this.generarRecomendaciones(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Detectar problemas basado en desvíos de meta
   */
  detectarProblemas() {
    // ROAS bajo
    const desvioRoas = ((this.kpis.roas - this.metas.roas) / this.metas.roas) * 100;
    if (desvioRoas < -20) {
      this.alertas.push({
        nivel: 'rojo',
        tipo: 'ROAS',
        desvio: desvioRoas.toFixed(1),
        actual: this.kpis.roas,
        meta: this.metas.roas,
        severidad: 'crítica',
        causa_probable: this.analizarCausaROAS(),
        acciones: [
          'Revisar creativos con baja performance',
          'Pausar campañas con ROAS < 2x',
          'Aumentar budget en creativos top',
          'Testear nuevas audiencias'
        ]
      });
    } else if (desvioRoas < -10) {
      this.alertas.push({
        nivel: 'amarillo',
        tipo: 'ROAS',
        desvio: desvioRoas.toFixed(1),
        actual: this.kpis.roas,
        meta: this.metas.roas,
        severidad: 'media',
        causa_probable: this.analizarCausaROAS(),
        acciones: ['Monitorear creativos', 'Revisar targeting']
      });
    }

    // CPC alto
    const desvioCpc = ((this.kpis.cpc - this.metas.cpc) / this.metas.cpc) * 100;
    if (desvioCpc > 30) {
      this.alertas.push({
        nivel: 'rojo',
        tipo: 'CPC',
        desvio: desvioCpc.toFixed(1),
        actual: this.kpis.cpc,
        meta: this.metas.cpc,
        severidad: 'crítica',
        causa_probable: 'Saturación de audiencias o competencia alta',
        acciones: [
          'Expandir audiencias',
          'Revisar dayparting',
          'Ajustar bid strategy',
          'Pausar audiencias con bajo ROAS'
        ]
      });
    } else if (desvioCpc > 15) {
      this.alertas.push({
        nivel: 'amarillo',
        tipo: 'CPC',
        desvio: desvioCpc.toFixed(1),
        actual: this.kpis.cpc,
        meta: this.metas.cpc,
        severidad: 'media',
        acciones: ['Monitorear audiencias', 'Revisar presupuesto']
      });
    }

    // Conversión baja
    const desvioConversion = ((this.kpis.conversion - this.metas.conversion) / this.metas.conversion) * 100;
    if (desvioConversion < -25) {
      this.alertas.push({
        nivel: 'rojo',
        tipo: 'CONVERSIÓN',
        desvio: desvioConversion.toFixed(1),
        actual: this.kpis.conversion,
        meta: this.metas.conversion,
        severidad: 'crítica',
        causa_probable: 'Problema en Tienda Nube (UX, velocidad, checkout)',
        acciones: [
          'Revisar velocidad de carga',
          'Testear checkout en mobile',
          'Verificar pixel de conversión',
          'Analizar abandono de carrito'
        ]
      });
    } else if (desvioConversion < -15) {
      this.alertas.push({
        nivel: 'amarillo',
        tipo: 'CONVERSIÓN',
        desvio: desvioConversion.toFixed(1),
        actual: this.kpis.conversion,
        meta: this.metas.conversion,
        severidad: 'media',
        acciones: ['Revisar UX', 'Testear mobile']
      });
    }
  }

  /**
   * Detectar oportunidades de crecimiento
   */
  detectarOportunidades() {
    // ROAS excelente
    const desvioRoas = ((this.kpis.roas - this.metas.roas) / this.metas.roas) * 100;
    if (desvioRoas > 25) {
      this.oportunidades.push({
        tipo: 'ESCALAR',
        descripcion: 'ROAS excelente - oportunidad de aumentar presupuesto',
        detalles: {
          roas_actual: this.kpis.roas,
          roas_meta: this.metas.roas,
          superacion: desvioRoas.toFixed(1) + '%'
        },
        acciones: [
          'Aumentar presupuesto en creativos top 20-30%',
          'Replicar estructura de campañas exitosas',
          'Testear nuevos mercados con audiencias similares',
          'Aumentar límite de presupuesto diario'
        ],
        potencial_ingresos: this.calcularPotencialIngresos()
      });
    } else if (desvioRoas > 10) {
      this.oportunidades.push({
        tipo: 'OPTIMIZAR',
        descripcion: 'ROAS por encima de meta - ampliar alcance',
        detalles: {
          roas_actual: this.kpis.roas,
          roas_meta: this.metas.roas
        },
        acciones: ['Aumentar presupuesto 10-15%', 'Testear audiencias similares']
      });
    }

    // AOV bajo → oportunidad de upsell
    if (this.kpis.aov && this.kpis.aov < this.metas.aov * 0.8) {
      this.oportunidades.push({
        tipo: 'UPSELL',
        descripcion: 'AOV bajo - oportunidad de aumentar ticket promedio',
        detalles: {
          aov_actual: this.kpis.aov,
          aov_meta: this.metas.aov,
          gap: (this.metas.aov - this.kpis.aov).toFixed(0)
        },
        acciones: [
          'Implementar bundle products',
          'Agregar cross-sell en checkout',
          'Crear combo packs con descuento',
          'Email retargeting con complementos'
        ]
      });
    }
  }

  /**
   * Generar insights contextuales
   */
  generarInsights() {
    // Insight: Eficiencia de spend
    const eficiencia = (this.kpis.revenue / this.kpis.spend).toFixed(2);
    this.insights.push({
      titulo: 'Eficiencia de Inversión',
      valor: `$${eficiencia} por cada peso invertido`,
      contexto: eficiencia > this.metas.roas ? 'Positivo' : 'Negativo',
      explicacion: `Por cada peso invertido en anuncios, obtenés ${eficiencia} pesos en revenue.`
    });

    // Insight: Trending
    if (this.datosHistoricos.roas_anterior) {
      const tendencia = ((this.kpis.roas - this.datosHistoricos.roas_anterior) / this.datosHistoricos.roas_anterior) * 100;
      this.insights.push({
        titulo: 'Tendencia ROAS',
        valor: tendencia.toFixed(1) + '%',
        direccion: tendencia > 0 ? 'subiendo' : 'bajando',
        explicacion: `ROAS ${tendencia > 0 ? 'aumentó' : 'disminuyó'} ${Math.abs(tendencia).toFixed(1)}% vs período anterior.`
      });
    }

    // Insight: Saturación
    if (this.kpis.cpc > this.metas.cpc * 1.3) {
      this.insights.push({
        titulo: 'Saturación de Audiencias',
        valor: 'MODERADA',
        contexto: 'warning',
        explicacion: 'Las audiencias pueden estar saturadas. CPC está 30%+ arriba de la meta.'
      });
    }
  }

  /**
   * Analizar causa probable de ROAS bajo
   */
  analizarCausaROAS() {
    // Si CPC está alto → problema de audiencias
    if (this.kpis.cpc > this.metas.cpc * 1.2) {
      return 'Audiencias saturadas o targeting muy amplio';
    }
    // Si conversión está baja → problema de landing
    if (this.kpis.conversion < this.metas.conversion * 0.8) {
      return 'Problema en conversión (UX, checkout, pixel)';
    }
    // Sino → creativos con fatiga
    return 'Creativos con fatiga o targeting incorrecto';
  }

  /**
   * Calcular potencial de ingresos si escalamos
   */
  calcularPotencialIngresos() {
    const incrementoPresupuesto = 0.3; // 30%
    const nuevoSpend = this.kpis.spend * (1 + incrementoPresupuesto);
    const nuevoRevenue = nuevoSpend * this.kpis.roas;
    const ingresoAdicional = nuevoRevenue - this.kpis.revenue;

    return {
      spend_actual: Math.round(this.kpis.spend),
      spend_proyectado: Math.round(nuevoSpend),
      revenue_actual: Math.round(this.kpis.revenue),
      revenue_proyectado: Math.round(nuevoRevenue),
      ingreso_adicional: Math.round(ingresoAdicional),
      roas_sostenible: this.kpis.roas
    };
  }

  /**
   * Generar recomendaciones priorizadas
   */
  generarRecomendaciones() {
    const recomendaciones = [];

    // Prioridad 1: Problemas críticos
    const criticas = this.alertas.filter(a => a.severidad === 'crítica');
    if (criticas.length > 0) {
      recomendaciones.push({
        prioridad: 1,
        titulo: 'ACCIÓN INMEDIATA',
        acciones: criticas.flatMap(a => a.acciones || [])
      });
    }

    // Prioridad 2: Oportunidades de escala
    const escalas = this.oportunidades.filter(o => o.tipo === 'ESCALAR');
    if (escalas.length > 0) {
      recomendaciones.push({
        prioridad: 2,
        titulo: 'ESCALAR CAMPAÑA',
        acciones: escalas.flatMap(o => o.acciones || [])
      });
    }

    // Prioridad 3: Optimizaciones
    const optimizaciones = this.oportunidades.filter(o => o.tipo === 'OPTIMIZAR');
    if (optimizaciones.length > 0) {
      recomendaciones.push({
        prioridad: 3,
        titulo: 'OPTIMIZAR',
        acciones: optimizaciones.flatMap(o => o.acciones || [])
      });
    }

    return recomendaciones;
  }
}

module.exports = AnalizadorInteligente;
