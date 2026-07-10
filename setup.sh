#!/bin/bash

# Script de Setup Automatizado - Dashboard MVR Backend
# Uso: bash setup.sh

echo "🚀 Dashboard MVR Backend - Setup Automatizado"
echo "=============================================="
echo ""

# 1. Verificar Node.js
echo "📋 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Descargá de nodejs.org"
    exit 1
fi
echo "✅ Node.js v$(node -v) encontrado"
echo ""

# 2. Instalar dependencias
echo "📦 Instalando dependencias..."
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "❌ Error en npm install"
    exit 1
fi
echo "✅ Dependencias instaladas"
echo ""

# 3. Crear .env si no existe
echo "🔐 Configurando variables de entorno..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Archivo .env creado (copia de .env.example)"
    echo "⚠️  IMPORTANTE: Editar .env y agregar META_ACCESS_TOKEN"
else
    echo "✅ Archivo .env ya existe"
fi
echo ""

# 4. Validar credenciales
echo "🔍 Validando credenciales..."
META_TOKEN=$(grep "META_ACCESS_TOKEN=" .env | cut -d'=' -f2)
if [ -z "$META_TOKEN" ] || [ "$META_TOKEN" = "EAAZAAfckHm6UBRZCh4R3U1q..." ]; then
    echo "⚠️  META_ACCESS_TOKEN no configurado en .env"
    echo "   Por favor editar .env y agregar el token"
else
    echo "✅ META_ACCESS_TOKEN configurado"
fi
echo ""

# 5. Listar archivos criticos
echo "📂 Verificando archivos..."
ARCHIVOS_REQUERIDOS=(
    "server-v3-mega.js"
    "meta-ads-api.js"
    "analizador-inteligente.js"
    "config-clientes.js"
    "package.json"
    ".env"
)

for archivo in "${ARCHIVOS_REQUERIDOS[@]}"; do
    if [ -f "$archivo" ]; then
        echo "   ✅ $archivo"
    else
        echo "   ❌ $archivo FALTA"
    fi
done
echo ""

# 6. Testear modulos
echo "🧪 Testeando módulos..."
node -e "require('./config-clientes.js'); console.log('✅ Config clientes OK');" 2>/dev/null
node -e "require('./meta-ads-api.js'); console.log('✅ Meta Ads API OK');" 2>/dev/null
node -e "require('./analizador-inteligente.js'); console.log('✅ Analizador inteligente OK');" 2>/dev/null
echo ""

# 7. Información final
echo "✨ Setup completado exitosamente!"
echo ""
echo "📍 Próximos pasos:"
echo "   1. Editar .env y agregar META_ACCESS_TOKEN"
echo "   2. Ejecutar: node server-v3-mega.js"
echo "   3. Probar: curl http://localhost:3000/api/health"
echo ""
echo "🎯 URLs importantes:"
echo "   Dashboard Completo: GET /api/dashboard-completo/pijameria"
echo "   Dashboard Rápido:   GET /api/dashboard-light/pijameria"
echo "   Resumen Ejecutivo:  GET /api/resumen-ejecutivo/pijameria"
echo "   Clientes:           GET /api/clientes"
echo ""
echo "📖 Documentación: Lee INDICE_RAPIDO.md"
echo ""
