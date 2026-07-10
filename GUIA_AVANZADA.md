# Dashboard MVR Backend v2.0 - Guía Avanzada

## 🚀 Nuevas Features

### 1. **Módulo MetaAdsAPI** (`meta-ads-api.js`)
Clase reutilizable para interactuar con Facebook Ads API.

**Métodos principales:**
```javascript
const metaAPI = new MetaAdsAPI(accessToken);

// Obtener insights
const insights = await metaAPI.getAccountInsights(adAccountId, 'last_30d');

// Procesar insights (calcular KPIs)
const processed = metaAPI.processInsights(insights);

// Identificar creativos top
const topCreatives = metaAPI.identifyTopCreatives(insights, 5);

// Generar reporte ejecutivo
const report = metaAPI.generateReport(insights, tiendaNubeData, metas);
```

### 2. **AnalizadorInteligente** (`analizador-inteligente.js`)
Sistema de análisis automático sin IA (base para integrar Claude).

**Detecta:**
- ✅ Problemas críticos (ROAS bajo, CPC alto, conversión baja)
- ✅ Oportunidades de escala
- ✅ Alertas por severidad
- ✅ Insights contextuales
- ✅ Recomendaciones priorizadas

**Ejemplo de uso:**
```javascript
const analizador = new AnalizadorInteligente(kpis, metas);
const analisis = analizador.analizar();

// Retorna:
// - alertas (con causa probable y acciones)
// - oportunidades (escalar, optimizar, upsell)
// - insights (eficiencia, trending, saturación)
// - recomendaciones (priorizadas por impacto)
```

---

## 📡 Endpoints v2.0

### `GET /api/dashboard/:cliente`
**Dashboard completo con todo incluido**

```bash
curl http://localhost:3000/api/dashboard/pijameria
```

**Response:**
```json
{
  "cliente": "pijameria",
  "tipo": "B2C Ecommerce",
  "kpis": {
    "roas": 12.39,
    "cpc": 123.14,
    "conversion": 2.18,
    "aov": 126570.89,
    "spend": 10398,
    "revenue": 2318736
  },
  "analisis": {
    "alertas": [...],
    "oportunidades": [...],
    "insights": [...],
    "recomendaciones": [...]
  },
  "reporte": {
    "meta_ads": {...},
    "tienda_nube": {...},
    "comparacion_metas": {...},
    "top_creatives": [...]
  }
}
```

---

### `GET /api/kpis/:cliente`
**Solo métricas (más rápido)**

```bash
curl http://localhost:3000/api/kpis/pijameria
```

**Response:**
```json
{
  "cliente": "pijameria",
  "kpis": {
    "roas": 12.39,
    "cpc": 123.14,
    "conversion": 2.18,
    "aov": 126570.89,
    "spend": 10398,
    "revenue": 2318736
  },
  "timestamp": "2026-06-22T22:00:00.000Z"
}
```

---

### `GET /api/analisis/:cliente`
**Análisis inteligente con alertas y oportunidades**

```bash
curl http://localhost:3000/api/analisis/pijameria
```

**Response:**
```json
{
  "cliente": "pijameria",
  "alertas": [
    {
      "nivel": "verde",
      "tipo": "ROAS",
      "desvio": "+24.0",
      "actual": 12.39,
      "meta": 10,
      "severidad": "positiva",
      "causa_probable": "...",
      "acciones": [...]
    }
  ],
  "oportunidades": [
    {
      "tipo": "ESCALAR",
      "descripcion": "ROAS excelente - oportunidad de aumentar presupuesto",
      "acciones": [...]
    }
  ],
  "insights": [
    {
      "titulo": "Eficiencia de Inversión",
      "valor": "$12.39 por cada peso invertido",
      "contexto": "Positivo"
    }
  ],
  "recomendaciones": [
    {
      "prioridad": 1,
      "titulo": "ESCALAR CAMPAÑA",
      "acciones": [...]
    }
  ]
}
```

---

### `GET /api/campañas/:cliente`
**Detalle de campañas y creativos top**

```bash
curl http://localhost:3000/api/campañas/pijameria
```

**Response:**
```json
{
  "cliente": "pijameria",
  "campañas": [
    {
      "id": "campaign_123",
      "nombre": "BROAD | Mujeres Argentina",
      "spend": 5000,
      "impressions": 15000,
      "clicks": 800,
      "roas": 15.2,
      "cpc": 6.25
    }
  ],
  "top_creativos": [
    {
      "campaign": "VIDEO FAMILIA ARG",
      "spend": 2250,
      "roas": "68.96",
      "conversions": 3
    }
  ],
  "total": {
    "spend": 10398,
    "revenue": 2318736,
    "roas": 12.39
  }
}
```

---

### `GET /api/comparativa`
**Comparar performance entre clientes**

```bash
curl http://localhost:3000/api/comparativa
```

**Response:**
```json
{
  "pijameria": {
    "roas": 12.39,
    "cpc": 123.14,
    "spend": 10398,
    "revenue": 2318736
  },
  "al_capone": {
    "roas": 7.1,
    "cpc": 135,
    "spend": 62000,
    "revenue": 440200
  }
}
```

---

### `POST /api/tienda-nube/:cliente`
**Actualizar datos de Tienda Nube manualmente**

```bash
curl -X POST http://localhost:3000/api/tienda-nube/pijameria \
  -H "Content-Type: application/json" \
  -d '{
    "visitas": 1700,
    "ventas": 40,
    "facturacion": 4800000,
    "aov": 120000,
    "conversion": 2.35
  }'
```

---

### `GET /api/health`
**Verificar que el servidor está corriendo**

```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Dashboard MVR Backend is running",
  "version": "2.0",
  "endpoints": [...],
  "clientes": ["pijameria", "al_capone"]
}
```

---

## 📊 Estructura de Alertas

Cada alerta tiene:

```javascript
{
  "nivel": "rojo|amarillo|verde",      // Severidad
  "tipo": "ROAS|CPC|CONVERSIÓN",       // Tipo de métrica
  "desvio": "-20.5",                   // % de desvío vs meta
  "actual": 8.2,                       // Valor actual
  "meta": 10,                          // Meta establecida
  "severidad": "crítica|media|positiva",
  "causa_probable": "...",             // Análisis automático
  "acciones": [                        // Recomendaciones accionables
    "Revisar creativos con baja performance",
    "Pausar campañas con ROAS < 2x",
    ...
  ]
}
```

---

## 🧠 Integración Future: Claude API

**Placeholder para integración (futuro próximo):**

```javascript
// client-analisis.js (futuro)
const AnalizadorInteligente = require('./analizador-inteligente');
const { Anthropic } = require('@anthropic-ai/sdk');

async function analizarConClaudeInteligencia(kpis, metas, datosHistoricos) {
  // 1. Análisis automático
  const analizador = new AnalizadorInteligente(kpis, metas, datosHistoricos);
  const analisisAutomatico = analizador.analizar();

  // 2. Enviar a Claude para insights aún más profundos
  const client = new Anthropic();
  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `
Analiza estos datos de marketing digital y proporciona insights profundos:
${JSON.stringify(analisisAutomatico, null, 2)}

Proporciona:
1. Diagnóstico de causa raíz
2. Estrategia de optimización
3. Proyecciones de impacto
`
    }]
  });

  return {
    analisisAutomatico,
    analisisConClaudeInteligencia: response.content[0].text
  };
}
```

---

## 🔐 Flujo Seguro

1. **Variables de entorno:** Credenciales NUNCA en código
2. **Caché inteligente:** Reduce llamadas a API Meta (1h por defecto)
3. **Rate limiting:** Preparado para producción
4. **Error handling:** Fallback graceful si Meta API falla

---

## 🎯 Casos de Uso

### Caso 1: Dashboard en tiempo real
```javascript
// Refresh cada 5 minutos
setInterval(async () => {
  const datos = await fetch('/api/dashboard/pijameria');
  actualizarDashboard(datos);
}, 5 * 60 * 1000);
```

### Caso 2: Alertas automáticas
```javascript
// Monitorear solo alertas críticas
const analisis = await fetch('/api/analisis/pijameria');
const criticas = analisis.alertas.filter(a => a.severidad === 'crítica');
if (criticas.length > 0) {
  enviarNotificacion(criticas);
}
```

### Caso 3: Reportes automáticos
```javascript
// Generar reporte diario
const datos = await fetch('/api/dashboard/pijameria');
const PDF = generarPDFDesde(datos);
enviarPorEmail(PDF, cliente@email.com);
```

---

## 📈 Próximos Pasos

- [ ] Integración Claude API (análisis profundo)
- [ ] Webhook de Meta (tiempo real)
- [ ] Base de datos (histórico de datos)
- [ ] Alertas por email/Slack
- [ ] Dashboard React consumiendo v2.0
- [ ] Mobile app

---

**¡Ya está todo listo para escalar!** 🚀
