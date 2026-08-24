#!/bin/bash
# ARCVA 2.0 - Setup Automatizado
# Uso: bash scripts/setup.sh

set -e

echo ""
echo "  ARCVA 2.0 - Setup"
echo "  ===================="
echo ""

# 0. Verificar pre-requisitos (Vite 8 exige Node ^20.19 ou >=22.12)
if ! command -v node >/dev/null 2>&1; then
  echo "ERRO: Node.js nao encontrado. Instalar >= 20.19 em https://nodejs.org" >&2
  exit 1
fi
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
NODE_MINOR=$(node -p "process.versions.node.split('.')[1]")
if [ "$NODE_MAJOR" -lt 20 ] || { [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -lt 19 ]; } || { [ "$NODE_MAJOR" -eq 21 ]; } || { [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -lt 12 ]; }; then
  echo "ERRO: Node $(node --version) nao suportado. Requerido: ^20.19.0 ou >=22.12.0" >&2
  exit 1
fi
echo "[0/4] Node $(node --version) OK"

# 1. Instalar dependencias
echo "[1/4] A instalar dependencias..."
npm install
echo "      Dependencias instaladas."

# 2. Copiar .env.example para .env.local se nao existir
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "[2/4] .env.local criado a partir de .env.example"
else
  echo "[2/4] .env.local ja existe, a manter"
fi

# 3. Configurar Convex
echo "[3/4] A configurar Convex..."
echo "      Se e a primeira vez, vai ser pedido para criar conta/projeto."
npx convex dev --once
echo "      Convex configurado."

# 4. Configurar API Key do Gemini no Convex
echo ""
echo "[4/4] Configuracao da API Key do Google Gemini"
echo "      (Necessaria para funcionalidades AI: chat, TTS, geracao de imagem)"
echo ""
read -p "      Tens uma API Key do Gemini? (s/n): " has_key
if [ "$has_key" = "s" ] || [ "$has_key" = "S" ]; then
  echo "      Introduz a tua API Key:"
  npx convex env set GEMINI_API_KEY
  echo "      API Key configurada no Convex!"
else
  echo "      Podes obter uma em: https://aistudio.google.com/apikey"
  echo "      Depois configura com: npx convex env set GEMINI_API_KEY"
fi

# Verificar
echo ""
echo "  Setup completo!"
echo ""
echo "  Comandos para iniciar:"
echo "    npx convex dev    (terminal 1 - backend)"
echo "    npm run dev        (terminal 2 - frontend)"
echo ""
echo "  Abrir em: http://localhost:3000"
echo ""
