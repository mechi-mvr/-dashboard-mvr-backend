const nodemailer = require('nodemailer');
const axios = require('axios');

/**
 * Sistema de alertas para cambios críticos en métricas
 */
class SistemaAlertas {
  constructor(config = {}) {
    this.emailConfig = config.email || null;
    this.slackWebhook = config.slackWebhook || null;
    this.webhookUrls = config.webhooks || [];
    this.historicoAlertas = [];
    this.umbralAlertaMinutos = 15; // Evitar spam: máximo una alerta cada 15 min
  }

  /**
   * Procesar alertas y enviar notificaciones
   */
  async procesarAlertas(cliente, alertas, kpis, tiendaNubeData) {
    const alertasCriticas = alertas.filter(a => a.severidad === 'crítica');
    
    if (alertasCriticas.length === 0) {
      return { enviadas: 0, status: 'sin_alertas' };
    }

    // Verificar si no es spam (no enviar la misma alerta en menos de 15 min)
    const debeEnviar = this.debeEnviarAlerta(cliente, alertasCriticas);
    if (!debeEnviar) {
      return { enviadas: 0, status: 'filtrado_por_spam' };
    }

    const resultado = {
      enviadas: 0,
      email: false,
      slack: false,
      webhooks: []
    };

    // Enviar por email
    if (this.emailConfig) {
      try {
        await this.enviarPorEmail(cliente, alertasCriticas, kpis);
        resultado.email = true;
        resultado.enviadas++;
      } catch (error) {
        console.error('Error enviando email:', error.message);
      }
    }

    // Enviar a Slack
    if (this.slackWebhook) {
      try {
        await this.enviarASlack(cliente, alertasCriticas, kpis);
        resultado.slack = true;
        resultado.enviadas++;
      } catch (error) {
        console.error('Error enviando a Slack:', error.message);
      }
    }

    // Enviar a webhooks customizados
    for (const webhook of this.webhookUrls) {
      try {
        await this.enviarAWebhook(webhook, cliente, alertasCriticas, kpis);
        resultado.webhooks.push({ url: webhook, status: 'success' });
      } catch (error) {
        resultado.webhooks.push({ url: webhook, status: 'error', error: error.message });
      }
    }

    // Registrar en histórico
    this.historicoAlertas.push({
      cliente,
      fecha: new Date(),
      alertas_count: alertasCriticas.length,
      tipos: alertasCriticas.map(a => a.tipo),
      resultado
    });

    return resultado;
  }

  /**
   * Enviar alerta por email
   */
  async enviarPorEmail(cliente, alertas, kpis) {
    if (!this.emailConfig?.from || !this.emailConfig?.to) {
      throw new Error('Email no configurado correctamente');
    }

    const transporter = nodemailer.createTransport(this.emailConfig.smtp);

    const html = this.generarHTMLEmail(cliente, alertas, kpis);
    const asunto = `🚨 ALERTA CRÍTICA: ${cliente.toUpperCase()} - ${alertas.length} problemas detectados`;

    const mailOptions = {
      from: this.emailConfig.from,
      to: this.emailConfig.to,
      subject: asunto,
      html: html
    };

    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) reject(error);
        else resolve(info);
      });
    });
  }

  /**
   * Enviar a Slack
   */
  async enviarASlack(cliente, alertas, kpis) {
    const mensajes = alertas.map(alerta => ({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🚨 ${alerta.tipo}*\n` +
              `Actual: ${alerta.actual} | Meta: ${alerta.meta}\n` +
              `Desvío: ${alerta.desvio}%\n` +
              `Causa: ${alerta.causa_probable}`
      }
    }));

    const payload = {
      channel: this.slackWebhook.channel || '#alertas-marketing',
      username: 'Dashboard MVR',
      icon_emoji: ':chart_with_upwards_trend:',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🚨 ALERTA CRÍTICA: ${cliente.toUpperCase()}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*KPIs Actuales:*\n` +
                  `ROAS: ${kpis.roas}x | CPC: $${kpis.cpc} | Conversión: ${kpis.conversion}%`
          }
        },
        ...mensajes,
        {
          type: 'divider'
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Ver Dashboard'
              },
              url: `https://dashboard-mvr.vercel.app/dashboard/${cliente}`,
              style: 'danger'
            }
          ]
        }
      ]
    };

    return axios.post(this.slackWebhook.url, payload);
  }

  /**
   * Enviar a webhook personalizado
   */
  async enviarAWebhook(webhookUrl, cliente, alertas, kpis) {
    const payload = {
      tipo: 'alerta_critica',
      cliente,
      timestamp: new Date().toISOString(),
      alertas: alertas.map(a => ({
        tipo: a.tipo,
        severidad: a.severidad,
        actual: a.actual,
        meta: a.meta,
        desvio: a.desvio,
        causa: a.causa_probable
      })),
      kpis
    };

    return axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Generar HTML para email
   */
  generarHTMLEmail(cliente, alertas, kpis) {
    const alertasHTML = alertas.map(alerta => `
      <div style="margin: 15px 0; padding: 15px; border-left: 4px solid #e74c3c; background: #f8f9fa;">
        <h3 style="color: #e74c3c; margin: 0 0 10px 0;">${alerta.tipo}</h3>
        <p style="margin: 5px 0;"><strong>Actual:</strong> ${alerta.actual}</p>
        <p style="margin: 5px 0;"><strong>Meta:</strong> ${alerta.meta}</p>
        <p style="margin: 5px 0;"><strong>Desvío:</strong> <span style="color: #e74c3c; font-weight: bold;">${alerta.desvio}%</span></p>
        <p style="margin: 5px 0;"><strong>Causa probable:</strong> ${alerta.causa_probable}</p>
        <h4 style="margin: 10px 0 5px 0;">Acciones recomendadas:</h4>
        <ul style="margin: 0;">
          ${alerta.acciones.map(acc => `<li>${acc}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .kpis { background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .kpi-item { display: inline-block; margin-right: 30px; }
            .kpi-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
            .footer { text-align: center; margin-top: 30px; color: #7f8c8d; font-size: 12px; }
            a { color: #3498db; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🚨 ALERTA CRÍTICA</h1>
              <p style="margin: 10px 0 0 0;">Cliente: <strong>${cliente.toUpperCase()}</strong></p>
              <p style="margin: 5px 0 0 0;">Fecha: ${new Date().toLocaleString('es-AR')}</p>
            </div>

            <h2>Estado Actual</h2>
            <div class="kpis">
              <div class="kpi-item">
                <div style="font-size: 12px; color: #7f8c8d;">ROAS</div>
                <div class="kpi-value">${kpis.roas}x</div>
              </div>
              <div class="kpi-item">
                <div style="font-size: 12px; color: #7f8c8d;">CPC</div>
                <div class="kpi-value">$${kpis.cpc}</div>
              </div>
              <div class="kpi-item">
                <div style="font-size: 12px; color: #7f8c8d;">Conversión</div>
                <div class="kpi-value">${kpis.conversion}%</div>
              </div>
            </div>

            <h2>Problemas Detectados</h2>
            ${alertasHTML}

            <div class="footer">
              <p>
                <a href="https://dashboard-mvr.vercel.app">Ver Dashboard Completo</a> | 
                <a href="mailto:soporte@comunicaconsentido.com">Contactar Soporte</a>
              </p>
              <p>Dashboard MVR • Comunicá con Sentido</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Verificar si debe enviar alerta (evitar spam)
   */
  debeEnviarAlerta(cliente, alertas) {
    const ultimaAlerta = this.historicoAlertas
      .filter(a => a.cliente === cliente)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];

    if (!ultimaAlerta) return true;

    const minutosDesdeUltima = (Date.now() - new Date(ultimaAlerta.fecha)) / (1000 * 60);
    return minutosDesdeUltima > this.umbralAlertaMinutos;
  }

  /**
   * Configurar emails
   */
  configurarEmail(smtpConfig, from, to) {
    this.emailConfig = {
      smtp: smtpConfig,
      from,
      to
    };
  }

  /**
   * Configurar Slack
   */
  configurarSlack(webhookUrl, channel = '#alertas-marketing') {
    this.slackWebhook = {
      url: webhookUrl,
      channel
    };
  }

  /**
   * Agregar webhook customizado
   */
  agregarWebhook(url) {
    this.webhookUrls.push(url);
  }

  /**
   * Obtener histórico de alertas
   */
  obtenerHistorico(cliente = null) {
    if (cliente) {
      return this.historicoAlertas.filter(a => a.cliente === cliente);
    }
    return this.historicoAlertas;
  }
}

module.exports = SistemaAlertas;
