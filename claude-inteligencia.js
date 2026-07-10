const axios = require('axios');

/**
 * Integración con Anthropic Claude API
 * Para análisis profundo y generación de reportes inteligentes
 */
class ClaudeInteligencia {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.anthropic.com/v1/messages';
    this.model = 'claude-opus-4-6';
  }

  /**
   * Generar análisis profundo de datos de marketing
   */
  async analizarDatosMarketing(kpis, alertas, oportunidades, campañas) {
    const prompt = this.construirPromptAnalisis(kpis, alertas, oportunidades, campañas);

    return await this.llamarClaudeAPI(prompt, 'Análisis de Marketing');
  }

  /**
   * Generar recomendaciones estratégicas
   */
  async generarRecomendacionesEstrategicas(datosCliente, metricasHistoricas) {
    const prompt = this.construirPromptEstrategia(datosCliente, metricasHistoricas);

    return await this.llamarClaudeAPI(prompt, 'Estrategia');
  }

  /**
   * Generar resumen ejecutivo para cliente
   */
  async generarResumenEjecutivo(datosCompletos, nombreCliente) {
    const prompt = `
Sos una consultora de marketing especializada en ecommerce y publicidad digital.
Genera un resumen ejecutivo profesional para presentar a un cliente.

DATOS DEL CLIENTE: ${nombreCliente}

KPIs ACTUALES:
- ROAS: ${datosCompletos.kpis.roas}x
- CPC: $${datosCompletos.kpis.cpc}
- Conversión: ${datosCompletos.kpis.conversion}%
- AOV: $${datosCompletos.kpis.aov}
- Spend: $${datosCompletos.kpis.spend}
- Revenue: $${datosCompletos.kpis.revenue}

ALERTAS DETECTADAS:
${datosCompletos.analisis.alertas.map(a => `- [${a.nivel.toUpperCase()}] ${a.tipo}: ${a.causa_probable}`).join('\n')}

OPORTUNIDADES:
${datosCompletos.analisis.oportunidades.map(o => `- ${o.tipo}: ${o.descripcion}`).join('\n')}

Genera un resumen ejecutivo que incluya:
1. Estado actual (qué está funcionando bien y qué no)
2. Diagnosis (causa raíz de problemas)
3. Oportunidades de crecimiento inmediatas
4. Plan de acción priorizadas
5. Proyección de impacto si se implementan recomendaciones

Tono: Profesional pero accesible, sin jerga técnica innecesaria.
Formato: Párrafos claros y concisos, con datos concretos.
`;

    return await this.llamarClaudeAPI(prompt, 'Resumen Ejecutivo');
  }

  /**
   * Analizar tendencias y predecir direcciones futuras
   */
  async analizarTendencias(datosHistoricos) {
    const prompt = `
Analiza estas tendencias de marketing y proporciona predicciones:

DATOS HISTÓRICOS (últimos 30 días):
${JSON.stringify(datosHistoricos, null, 2)}

Proporciona:
1. Tendencias detectadas (ROAS, CPC, conversión)
2. Patrones estacionales o cíclicos
3. Predicciones para próximos 7-14 días
4. Señales de alerta temprana
5. Oportunidades antes de que se hagan evidentes
`;

    return await this.llamarClaudeAPI(prompt, 'Tendencias');
  }

  /**
   * Generar plan de testing/experimentación
   */
  async generarPlanTesting(kpis, metas, campañasActuales) {
    const prompt = `
Sos especialista en growth marketing y testing. 
Diseña un plan de testing para mejorar performance.

ESTADO ACTUAL:
- ROAS: ${kpis.roas}x (meta: ${metas.roas}x)
- CPC: $${kpis.cpc} (meta: $${metas.cpc})
- Conversión: ${kpis.conversion}% (meta: ${metas.conversion}%)

CAMPAÑAS ACTIVAS: ${campañasActuales.length}

Diseña un plan de testing con:
1. Hipótesis de testing (qué vamos a testear y por qué)
2. Experimentos específicos (creativos, audiencias, landing pages)
3. Métrica de éxito para cada test
4. Timeline estimado
5. Presupuesto recomendado
6. Criterios de escala o pausa

Formato: Paso a paso, accionable, con números concretos.
`;

    return await this.llamarClaudeAPI(prompt, 'Plan Testing');
  }

  /**
   * Diagnosticar problema específico
   */
  async diagnosticarProblema(tipoProblema, kpis, contexto) {
    const prompt = `
Diagnostica este problema de marketing digital:

PROBLEMA: ${tipoProblema}

CONTEXTO ACTUAL:
- ROAS: ${kpis.roas}x
- CPC: $${kpis.cpc}
- Conversión: ${kpis.conversion}%
- Datos adicionales: ${contexto}

Proporciona:
1. Causas probables (ordenadas por probabilidad)
2. Cómo validar cada causa
3. Soluciones específicas para cada causa
4. Timeline de implementación
5. KPIs a monitorear para validar la solución
`;

    return await this.llamarClaudeAPI(prompt, 'Diagnóstico');
  }

  /**
   * Construir prompt para análisis
   */
  construirPromptAnalisis(kpis, alertas, oportunidades, campañas) {
    return `
Sos una consultora de marketing digital experta en ecommerce.
Analiza estos datos y proporciona insights accionables.

KPIs:
- ROAS: ${kpis.roas}x
- CPC: $${kpis.cpc}
- Conversión: ${kpis.conversion}%
- AOV: $${kpis.aov}
- Spend: $${kpis.spend}
- Revenue: $${kpis.revenue}

ALERTAS ACTUALES:
${alertas.map(a => `[${a.nivel.toUpperCase()}] ${a.tipo}: ${a.causa_probable}`).join('\n')}

OPORTUNIDADES IDENTIFICADAS:
${oportunidades.map(o => `- ${o.tipo}: ${o.descripcion}`).join('\n')}

CAMPAÑAS TOP:
${campañas.slice(0, 5).map(c => `- ${c.nombre}: $${c.spend} spend, ${c.roas}x ROAS`).join('\n')}

Proporciona:
1. Análisis actual (qué está pasando)
2. Por qué están pasando estas cosas
3. Qué cambios harías primero (prioridad)
4. Impacto estimado de cada cambio
5. Timeline realista
`;
  }

  /**
   * Construir prompt para estrategia
   */
  construirPromptEstrategia(datosCliente, metricasHistoricas) {
    return `
Diseña una estrategia de marketing digital para el siguiente mes.

CLIENTE: ${datosCliente.nombre}
TIPO: ${datosCliente.tipo}
INDUSTRIA: ${datosCliente.industria}

MÉTRICAS ACTUALES:
${JSON.stringify(datosCliente.kpis, null, 2)}

HISTÓRICO (últimos 3 meses):
${JSON.stringify(metricasHistoricas, null, 2)}

Proporciona una estrategia que incluya:
1. Objetivos mensuales específicos (SMART)
2. Iniciativas por canal (Meta, Google, email, etc)
3. Calendario de ejecución
4. Presupuesto recomendado
5. KPIs a seguir
6. Contingencias si no estamos on track
`;
  }

  /**
   * Llamar API de Claude
   */
  async llamarClaudeAPI(prompt, tipo = 'General') {
    if (!this.apiKey) {
      console.warn('⚠️ Claude API Key no configurada. Saltando análisis IA.');
      return {
        tipo,
        status: 'skipped',
        mensaje: 'Claude API no disponible. Contacta a tu administrador.'
      };
    }

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: this.model,
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      return {
        tipo,
        status: 'success',
        analisis: response.data.content[0].text,
        uso_tokens: {
          input: response.data.usage.input_tokens,
          output: response.data.usage.output_tokens
        }
      };
    } catch (error) {
      console.error(`Error llamando Claude API (${tipo}):`, error.response?.data || error.message);
      
      return {
        tipo,
        status: 'error',
        error: error.message,
        fallback: 'Análisis IA temporalmente no disponible. Usando análisis automático.'
      };
    }
  }

  /**
   * Generar prompt personalizado (para casos custom)
   */
  async analizarPromptCustom(prompt) {
    return await this.llamarClaudeAPI(prompt, 'Custom');
  }
}

module.exports = ClaudeInteligencia;
