# Dashboard MVR Backend

Backend para **Dashboard MVR** - integración automática de Meta Ads + Tienda Nube para análisis en tiempo real.

---

## 🎯 ¿Qué hace?

1. **Obtiene datos de Meta Ads Manager** cada hora automático
2. **Procesa CSV de Tienda Nube** (actualización manual)
3. **Calcula KPIs**: ROAS, CPC, Conversión, AOV, Margin
4. **Detecta alertas** automáticas (ROAS bajo, CPC alto, conversión baja)
5. **Expone endpoints** para que el dashboard React consuma datos

---

## 📊 Clientes soportados

- **Pijamería** (B2C ecommerce)
  - Meta Ads: cada 1 hora
  - Tienda Nube: CSV manual (1-2 veces por semana)
  
- **Al Capone** (B2C ecommerce, sin conversiones TN aún)
  - Meta Ads: cada 30 min (tiempo real)

---

## 🚀 Setup local (desarrollo)

### 1. Clonar repo
```bash
git clone https://github.com/mechi-mvr/dashboard-mvr-backend.git
cd dashboard-mvr-backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Crear archivo `.env`
Copiar `.env.example` a `.env` y llenar:
```
META_ACCESS_TOKEN=tu_token_aqui
META_APP_ID=1546784666888573
META_APP_SECRET=tu_secret_aqui
PORT=3000
```

### 4. Correr localmente
```bash
npm run dev
```

Server corre en `http://localhost:3000`

---

## 📡 Endpoints

### `GET /api/dashboard/:cliente`
Obtiene datos del cliente (Pijamería o Al Capone)

**Ejemplo:**
```bash
GET /api/dashboard/pijameria
```

**Response:**
```json
{
  "cliente": "pijameria",
  "tipo": "B2C",
  "kpis": {
    "roas": "12.39",
    "cpc": "123.14",
    "conversion": 2.18,
    "aov": 126570.89,
    "margin": 40
  },
  "alertas": [
    {
      "nivel": "verde",
      "msg": "ROAS +24% vs meta. ¡Excelente!"
    }
  ],
  "metaData": {
    "campaigns": [...],
    "totalSpend": 10398,
    "totalRevenue": 2318736
  },
  "tiendaNubeData": {
    "visitas": 1650,
    "ventas": 36,
    "facturacion": 4556552
  }
}
```

### `GET /api/health`
Health check del servidor

```bash
GET /api/health
```

### `POST /api/tienda-nube/:cliente`
Actualizar datos de Tienda Nube (manual)

**Ejemplo:**
```bash
POST /api/tienda-nube/pijameria
Content-Type: application/json

{
  "visitas": 1700,
  "ventas": 40,
  "facturacion": 4800000,
  "aov": 120000,
  "conversion": 2.35
}
```

---

## 🔄 Flujo de actualización

### Pijamería
1. **Meta Ads**: API trae datos automático cada hora
2. **Tienda Nube**: Vos exportas CSV, yo actualizo manualmente (POST endpoint)
3. **Dashboard**: Combina ambas fuentes, calcula KPIs, detecta alertas

### Al Capone
1. **Meta Ads**: API trae datos cada 30 min (tiempo real)
2. **Tienda Nube**: Sin datos aún (sin conversiones)
3. **Dashboard**: Solo datos de Meta para debuggear anuncios

---

## 🔐 Seguridad

- Credenciales en **variables de entorno** (nunca en código)
- Access Token de Meta: **renovado cada hora**
- Vercel maneja secrets automáticamente
- Repo en GitHub es **privado**

---

## 🛠️ Deployment en Vercel

1. Conectar GitHub a Vercel
2. Autorizar repo
3. Vercel auto-deploya cada push
4. Agregar environment variables en Vercel dashboard:
   - `META_ACCESS_TOKEN`
   - `META_APP_ID`
   - `META_APP_SECRET`

**URL en vivo:** `https://dashboard-mvr.vercel.app`

---

## 📝 Próximos pasos

- [ ] Integración automática Tienda Nube API (en lugar de CSV manual)
- [ ] Webhook de Meta para actualización real-time
- [ ] Base de datos (MongoDB) para histórico
- [ ] Integración Claude API para análisis inteligente
- [ ] Dashboard React mejorado

---

## 👩‍💻 Contacto

**Mechi Vega Robles** | Comunicá con Sentido
- GitHub: `mechi-mvr`
- Email: `m.mercedes.vegarobles@gmail.com`

---

**Última actualización:** Junio 2026
