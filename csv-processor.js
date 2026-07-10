const fs = require('fs');
const csv = require('csv-parser');

/**
 * Procesar CSV de Tienda Nube y extraer métricas
 * @param {string} filePath - Ruta del archivo CSV
 * @param {string} cliente - 'pijameria' o 'al_capone'
 * @returns {Promise<Object>} Datos procesados
 */
async function procesarCSVTiendaNube(filePath, cliente) {
  return new Promise((resolve, reject) => {
    const datos = {
      ordenes: [],
      productos: {},
      totales: {
        ordenes: 0,
        productos_vendidos: 0,
        monto_total: 0,
        descuentos_aplicados: 0,
        costos_envio: 0
      }
    };

    fs.createReadStream(filePath)
      .pipe(csv({
        separator: ';',
        headers: [
          'numero_orden', 'email', 'fecha', 'estado_orden', 'estado_pago',
          'estado_envio', 'moneda', 'subtotal_productos', 'descuento',
          'costo_envio', 'total', 'nombre_comprador', 'dni', 'telefono',
          'nombre_envio', 'telefono_envio', 'direccion', 'numero', 'piso',
          'localidad', 'ciudad', 'codigo_postal', 'provincia', 'pais',
          'medio_envio', 'medio_pago', 'cupon', 'notas_comprador',
          'notas_vendedor', 'fecha_pago', 'fecha_envio', 'nombre_producto',
          'precio_producto', 'cantidad_producto', 'sku', 'canal'
        ]
      }))
      .on('data', (row) => {
        if (row.numero_orden && row.total) {
          const monto = parseFloat(row.total) || 0;
          const cantidad = parseInt(row.cantidad_producto) || 0;
          const descuento = parseFloat(row.descuento) || 0;
          const envio = parseFloat(row.costo_envio) || 0;

          // Agregar orden
          datos.ordenes.push({
            numero: row.numero_orden,
            fecha: row.fecha,
            estado: row.estado_orden,
            monto,
            medio_pago: row.medio_pago
          });

          // Contar métricas
          datos.totales.ordenes++;
          datos.totales.productos_vendidos += cantidad;
          datos.totales.monto_total += monto;
          datos.totales.descuentos_aplicados += descuento;
          datos.totales.costos_envio += envio;

          // Agrupar por producto
          if (row.nombre_producto) {
            if (!datos.productos[row.nombre_producto]) {
              datos.productos[row.nombre_producto] = {
                nombre: row.nombre_producto,
                sku: row.sku,
                cantidad_vendida: 0,
                revenue: 0
              };
            }
            datos.productos[row.nombre_producto].cantidad_vendida += cantidad;
            datos.productos[row.nombre_producto].revenue += monto;
          }
        }
      })
      .on('end', () => {
        // Calcular métricas finales
        const resultado = {
          cliente,
          visitas: calcularVisitas(datos.totales.ordenes),
          ventas: datos.totales.ordenes,
          facturacion: Math.round(datos.totales.monto_total),
          aov: datos.totales.ordenes > 0 
            ? (datos.totales.monto_total / datos.totales.ordenes).toFixed(2)
            : 0,
          conversion: calcularConversion(datos.totales.ordenes),
          productos_top: Object.values(datos.productos)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10),
          fecha_actualizado: new Date(),
          datos_brutos: datos
        };

        resolve(resultado);
      })
      .on('error', reject);
  });
}

/**
 * Estimar visitas en base a ordenes (aproximadamente)
 */
function calcularVisitas(ordenes) {
  // Asumiendo ~2-3% de conversión típica, estimamos visitas
  return Math.round(ordenes / 0.025); // Conversión estimada del 2.5%
}

/**
 * Calcular tasa de conversión (órdenes / visitas estimadas)
 */
function calcularConversion(ordenes) {
  const visitas = calcularVisitas(ordenes);
  return visitas > 0 ? ((ordenes / visitas) * 100).toFixed(2) : 0;
}

/**
 * Exportar para pruebas
 */
module.exports = {
  procesarCSVTiendaNube,
  calcularVisitas,
  calcularConversion
};

// Ejemplo de uso (si se corre este archivo directamente)
if (require.main === module) {
  const archivoCSV = process.argv[2];
  const cliente = process.argv[3] || 'pijameria';

  if (!archivoCSV) {
    console.log('Uso: node csv-processor.js <ruta-csv> [cliente]');
    process.exit(1);
  }

  procesarCSVTiendaNube(archivoCSV, cliente)
    .then(resultado => {
      console.log(JSON.stringify(resultado, null, 2));
    })
    .catch(err => {
      console.error('Error procesando CSV:', err);
      process.exit(1);
    });
}
